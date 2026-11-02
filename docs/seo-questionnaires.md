# SEO-vragenlijsten

Open HQ → SEO-vragenlijsten → Nieuwe vragenlijst → kies een klant. Bedrijfsnaam en contactgegevens worden vooraf ingevuld waar beschikbaar. Een klantfiche heeft ook een knop naar de bijbehorende vragenlijsten.

Open de vragenlijst en kies **Klantlink**. Kopieer de link of het bijbehorende bericht en verstuur het zelf. Er wordt niet automatisch een bericht verstuurd. De willekeurige link is 60 dagen geldig en kan worden ingetrokken. Iedereen met de volledige link kan de betreffende vragenlijst bekijken; deel hem alleen met de betreffende klant. Het token staat in het URL-fragment, niet in de pagina-aanvraag of verwijzende URL.

De klant vult 29 vragen in zeven stappen in zonder account, bewaart per stap en kan later verdergaan. Bedrijfsgegevens, contactpersoon en doelstelling zijn vereist bij definitief verzenden; overige antwoorden zijn optioneel. Na verzending is het klantformulier gesloten voor wijzigingen. Alle antwoorden verschijnen onder dezelfde klant in HQ. Ververs het overzicht om nieuwe inzendingen te laden.

Interne notities en gekozen prioritaire zoekwoorden zijn aparte velden, uitsluitend voor HQ. De briefing kan als Markdown worden gedownload.

## Opslag en toegang

`public.seo_questionnaires` bewaart de gegevens met Supabase RLS: geauthenticeerde gebruikers kunnen uitsluitend eigen rijen lezen, toevoegen en bijwerken. De `anon`-rol heeft geen tabelrechten. De klant-API `seo-intake` gebruikt zelf de willekeurige, intrekbare, aflopende 256-bit link als authenticatie. De API geeft alleen de klantnaam, titel, status, antwoorden en tijdstempels terug, nooit interne notities, prioritaire zoekwoorden, eigenaar-ID’s of tokens. Definitieve inzendingen en wijzigingen gebruiken een tijdstempelcontrole om gelijktijdig overschrijven te voorkomen.

Geen wijzigingen aan bestaande website-intakes, Wise, facturen of klantgegevens. Er wordt geen melding/e-mail automatisch verstuurd.

## Validatie

- `node --test tests/seo-intake.test.mjs`: schema, toegangsgrenzen, privédataveldscheiding, validatie, definitief verzenden, herhaalde verzending, verlopen links en versieconflicten.
- Volledige formulierstappen en CRM aanmaken/opslaan/delen gecontroleerd in de browser met fictieve gegevens; mobiele formulierweergave op 390 px geïnspecteerd.
- Live Edge Function lezen → concept opslaan → herladen → verzenden → herhaalde overschrijving weigeren getest met een tijdelijk QA-dossier. Dat dossier is daarna verwijderd.
- Een geauthenticeerde sessie van de eigenaar is niet gebruikt om echte klantdossiers aan te maken; CRM UI getest met een gesimuleerde Supabase-client, opslag/API afzonderlijk tegen de echte database.
