--
-- Name: contacts; Type: TABLE; Schema: laschubys; Owner: -
--

CREATE TABLE laschubys.contacts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT contacts_message_check CHECK ((char_length(message) <= 2000))
);

--
-- Name: contacts contacts_pkey; Type: CONSTRAINT; Schema: laschubys; Owner: -
--

ALTER TABLE ONLY laschubys.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);

--
-- Name: contacts; Type: ROW SECURITY; Schema: laschubys; Owner: -
--

ALTER TABLE laschubys.contacts ENABLE ROW LEVEL SECURITY;

--
-- Name: contacts lch_contacts_select; Type: POLICY; Schema: laschubys; Owner: -
--

CREATE POLICY lch_contacts_select ON laschubys.contacts FOR SELECT USING (laschubys.is_admin());

--
-- Name: contacts lch_contacts_delete; Type: POLICY; Schema: laschubys; Owner: -
--

CREATE POLICY lch_contacts_delete ON laschubys.contacts FOR DELETE USING (laschubys.is_admin());
