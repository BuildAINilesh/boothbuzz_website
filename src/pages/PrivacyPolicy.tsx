import React from 'react';
import { Link } from 'react-router-dom';
import { LegalPageLayout, LegalSection } from '../components/LegalPageLayout';
import { LEGAL } from '../constants/legal';

export default function PrivacyPolicy() {
  return (
    <LegalPageLayout title="Privacy Policy">
      <LegalSection title="1. Who we are">
        <p>
          {LEGAL.brandName} (“we”, “us”, “our”) operates {LEGAL.siteUrl} and related services that help
          communities and venues host exhibitions and help exhibitors and visitors discover events, register for
          booths, and—where enabled—browse exhibitor catalogues and place order requests.
        </p>
      </LegalSection>

      <LegalSection title="2. Scope">
        <p>
          This Privacy Policy describes how we collect, use, store, and share personal data when you use our website
          as a visitor, exhibitor, event registrant, or customer placing an order through an exhibitor’s catalogue.
        </p>
      </LegalSection>

      <LegalSection title="3. Data we collect">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Visitors:</strong> pages viewed, device and browser information, IP address (via hosting or
            analytics if enabled), cookies or similar technologies, and information you submit through contact forms.
          </li>
          <li>
            <strong>Exhibitors:</strong> company and contact details (name, email, phone, address, city, category,
            website, description), event registration data, optional documents (company profile, GST, PAN, product
            catalog), and images (logo, portfolio, product and gallery photos), and login identifiers (e.g. phone
            number or account credentials).
          </li>
          <li>
            <strong>Event registration:</strong> exhibitor identity, booth preferences, payment method selection,
            registration status, and related event information.
          </li>
          <li>
            <strong>Customers (catalogue orders):</strong> name, phone, optional email, order items, fulfillment
            choice (exhibition pickup or home delivery), delivery address and notes when applicable, and order and
            payment status.
          </li>
          <li>
            <strong>Technical data:</strong> data stored in your browser (e.g. shopping cart in local storage,
            session preferences) and data processed by our service providers listed below.
          </li>
        </ul>
        <p>
          We do not intentionally collect sensitive personal data unless you voluntarily provide it in documents you
          upload. Please do not upload more information than necessary.
        </p>
      </LegalSection>

      <LegalSection title="4. How we use your data">
        <ul className="list-disc pl-5 space-y-2">
          <li>Operate and improve the platform (events, profiles, registrations, catalogues, orders).</li>
          <li>Display exhibitor and event information to the public.</li>
          <li>Process registrations and order requests, and share order details with the relevant exhibitor.</li>
          <li>Communicate with you about your account, registrations, or orders.</li>
          <li>Security, fraud prevention, troubleshooting, and legal compliance.</li>
          <li>Marketing only where permitted and with your consent where required.</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Legal basis (India)">
        <p>
          We process personal data as needed to provide our services, with your consent where required (e.g. marketing
          or non-essential cookies), and to comply with applicable law. You should provide accurate information.
        </p>
      </LegalSection>

      <LegalSection title="6. Sharing of data">
        <p>We may share data with:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Exhibitors and event organizers</strong> — to run events and fulfill catalogue orders.
          </li>
          <li>
            <strong>Service providers</strong> — hosting and database (e.g. Supabase), file storage for uploads,
            payment processors (e.g. Razorpay when enabled), and email or SMS providers if used.
          </li>
          <li>
            <strong>Authorities</strong> — when required by law or to protect rights and safety.
          </li>
        </ul>
        <p>We do not sell your personal data.</p>
      </LegalSection>

      <LegalSection title="7. Public information">
        <p>
          Exhibitor profiles, active catalogue products, and event exhibitor listings may be visible to anyone using
          the site. Do not submit information you do not want to be public.
        </p>
      </LegalSection>

      <LegalSection title="8. Storage, security, and retention">
        <p>
          Data is stored on secure cloud infrastructure. No method of transmission or storage is completely secure.
          We retain data as long as needed for the purposes above, legal obligations, and dispute resolution, then
          delete or anonymize where reasonable. Cart data may remain in your browser until you clear it or complete an
          order.
        </p>
      </LegalSection>

      <LegalSection title="9. Your rights">
        <p>
          Subject to applicable law, including India’s Digital Personal Data Protection Act, 2023, you may request
          access, correction, erasure, or withdrawal of consent (where processing is consent-based), and grievance
          redressal. Contact us at{' '}
          <a href={`mailto:${LEGAL.email}`} className="text-primary font-semibold hover:underline">
            {LEGAL.email}
          </a>
          . You may lodge a complaint with the Data Protection Board of India when applicable.
        </p>
      </LegalSection>

      <LegalSection title="10. Children">
        <p>Our services are not directed at anyone under 18. We do not knowingly collect data from children.</p>
      </LegalSection>

      <LegalSection title="11. Third-party links">
        <p>
          Our site may link to third-party websites (exhibitor sites, venues, payment providers). Their privacy
          practices are governed by their own policies.
        </p>
      </LegalSection>

      <LegalSection title="12. International access">
        <p>
          If you access the site from outside India, your data may be processed in India or where our providers
          operate.
        </p>
      </LegalSection>

      <LegalSection title="13. Changes">
        <p>
          We may update this policy and post the revised version with a new date. Continued use after changes means you
          accept the updated policy where permitted by law.
        </p>
      </LegalSection>

      <LegalSection title="14. Contact">
        <p>
          <strong>{LEGAL.brandName}</strong>
          <br />
          Email:{' '}
          <a href={`mailto:${LEGAL.email}`} className="text-primary font-semibold hover:underline">
            {LEGAL.email}
          </a>
          <br />
          Phone:{' '}
          <a href={`tel:${LEGAL.phone.replace(/\s/g, '')}`} className="text-primary font-semibold hover:underline">
            {LEGAL.phoneDisplay}
          </a>
          <br />
          Address: {LEGAL.address}
          <br />
          Grievance officer: {LEGAL.grievanceOfficer} —{' '}
          <a href={`mailto:${LEGAL.grievanceEmail}`} className="text-primary font-semibold hover:underline">
            {LEGAL.grievanceEmail}
          </a>
        </p>
        <p>
          See also our <Link to="/terms" className="text-primary font-semibold hover:underline">Terms of Use</Link>.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
