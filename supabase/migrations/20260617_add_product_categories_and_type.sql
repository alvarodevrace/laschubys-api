-- Add categories table and extend products with category, product_type and slug.

begin;

-- Categories table.
create table if not exists laschubys.categories (
    id uuid default gen_random_uuid() not null primary key,
    slug text unique not null,
    name text not null,
    sort_order int default 0,
    active boolean default true
);

-- Seed categories.
insert into laschubys.categories (slug, name, sort_order, active)
values
    ('alimentacion', 'Alimentación', 1, true),
    ('cuidado', 'Cuidado', 2, true),
    ('juguetes', 'Juguetes', 3, true),
    ('descanso', 'Descanso', 4, true),
    ('higiene', 'Higiene', 5, true),
    ('accesorios', 'Accesorios', 6, true),
    ('para-humanos', 'Para humanos', 7, true),
    ('otros', 'Otros', 99, true)
on conflict (slug) do nothing;

-- Extend products with new columns.
alter table laschubys.products
    add column if not exists category_id uuid references laschubys.categories(id),
    add column if not exists product_type text,
    add column if not exists slug text unique;

-- Add constraint for product_type if not exists.
do $$
begin
    if not exists (
        select 1 from pg_constraint
        where conname = 'products_product_type_check'
        and conrelid = 'laschubys.products'::regclass
    ) then
        alter table laschubys.products
            add constraint products_product_type_check
            check (product_type = any (array['physical'::text, 'link'::text]));
    end if;
end $$;

-- Backfill existing products: assign to 'otros', infer type from source, generate slug from name.
update laschubys.products
set
    category_id = coalesce(
        category_id,
        (select id from laschubys.categories where slug = 'otros')
    ),
    product_type = coalesce(
        product_type,
        case source
            when 'owned' then 'physical'
            when 'affiliate' then 'link'
            else 'physical'
        end
    ),
    slug = coalesce(
        slug,
        (
            -- Generate unique slug from name using the same rules as the backend.
            with base as (
                select
                    lower(regexp_replace(
                        regexp_replace(
                            regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'),
                            '-+', '-', 'g'
                        ),
                        '^-|-$', '', 'g'
                    )) as base_slug
            ),
            candidates as (
                select
                    case
                        when length(base_slug) = 0 then 'producto'
                        else base_slug
                    end ||
                    case
                        when n = 0 then ''
                        else '-' || n::text
                    end as candidate,
                    n
                from base
                cross join generate_series(0, 1000) as n
                order by n
            )
            select candidate
            from candidates
            where not exists (
                select 1 from laschubys.products p2 where p2.slug = candidates.candidate
            )
            limit 1
        )
    );

-- Indexes for common lookups.
create index if not exists idx_products_category_id on laschubys.products(category_id);
create index if not exists idx_products_slug on laschubys.products(slug);
create index if not exists idx_products_product_type on laschubys.products(product_type);
create index if not exists idx_categories_active_sort on laschubys.categories(active, sort_order);

commit;
