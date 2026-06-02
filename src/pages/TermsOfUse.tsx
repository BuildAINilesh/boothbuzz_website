import React from 'react';
import { Link } from 'react-router-dom';
import { LegalPageLayout, LegalSection } from '../components/LegalPageLayout';
import { LEGAL } from '../constants/legal';

export default function TermsOfUse() {
  return (
    <LegalPageLayout title="Terms of Use">
      <LegalSection title="1. Agreement">
        <p>
          By accessing or using {LEGAL.siteUrl} (the “Site”) and {LEGAL.brandName} services (the “Services”), you agree
          to these Terms of Use (“Terms”). If you do not agree, do not use the Site.
        </p>
      </LegalSection>

      <LegalSection title="2. Who may use the Site">
        <p>
          You must be at least 18 years old and able to enter a binding contract. If you use the Site for a business,
          you represent that you have authority to bind that entity.
        </p>
      </LegalSection>

      <LegalSection title="3. Our role">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            {LEGAL.brandName} is a <strong>platform</strong> for discovering exhibitions and events, exhibitor
            registration, and—where enabled—exhibitor product catalogues and order requests.
          </li>
          <li>
            For <strong>catalogue orders</strong>, the <strong>exhibitor</strong> is the seller; we facilitate listing
            and transmitting orders unless we clearly state otherwise. Product quality, pricing, fulfillment, refunds,
            and disputes for those orders are primarily between you and the exhibitor, subject to applicable consumer
            law.
          </li>
          <li>
            <strong>Events</strong> may be run by third-party organizers; booth allocation and event rules follow the
            organizer’s communications and any event-specific terms.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Accounts and access">
        <p>
          Exhibitors may access portals using phone/OTP or other login methods we provide. You are responsible for
          account security and activity under your account. You must provide accurate registration and profile
          information.
        </p>
      </LegalSection>

      <LegalSection title="5. Acceptable use">
        <p>You agree not to:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Violate laws or others’ rights;</li>
          <li>Upload unlawful, infringing, or misleading content;</li>
          <li>Abuse, scrape, or disrupt the Site without permission;</li>
          <li>Impersonate others or manipulate orders or registrations;</li>
          <li>Circumvent security or access controls.</li>
        </ul>
        <p>We may suspend or terminate access for violations.</p>
      </LegalSection>

      <LegalSection title="6. Exhibitor content">
        <p>
          Exhibitors grant {LEGAL.brandName} a non-exclusive licence to host, display, and promote submitted content on
          the Site to operate the Services. Exhibitors warrant they have rights to their content and that it is lawful.
        </p>
      </LegalSection>

      <LegalSection title="7. Orders and payments">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            Orders placed through an exhibitor catalogue are recorded on our systems and shared with that exhibitor for
            fulfillment.
          </li>
          <li>
            Where live payment integration (e.g. Razorpay) is enabled, their terms also apply. Until we clearly state
            that payments are live, any demo or test checkout must not be relied on for real payment.
          </li>
          <li>Prices, taxes, shipping or pickup, and availability are set by exhibitors unless we state otherwise.</li>
        </ul>
      </LegalSection>

      <LegalSection title="8. Event registration">
        <p>
          Registering for an event does not guarantee a booth until confirmed by the organizer. You agree to follow
          venue and organizer rules.
        </p>
      </LegalSection>

      <LegalSection title="9. Intellectual property">
        <p>
          The Site, {LEGAL.brandName} branding, and our software are owned by us or our licensors. You may not copy or
          exploit them except as allowed by these Terms.
        </p>
      </LegalSection>

      <LegalSection title="10. Disclaimers">
        <p>
          The Site and Services are provided <strong>“as is”</strong> to the extent permitted by law. We do not warrant
          uninterrupted or error-free operation. Event dates, exhibitor details, and listings may change.
        </p>
      </LegalSection>

      <LegalSection title="11. Limitation of liability">
        <p>
          To the maximum extent permitted by Indian law, {LEGAL.brandName} and its affiliates are not liable for
          indirect or consequential damages, or for acts of exhibitors, organizers, or order disputes. Our total
          liability for claims relating to the Services in any twelve-month period is limited to the greater of (a)
          amounts you paid to us for the transaction giving rise to the claim, or (b) INR {LEGAL.liabilityCapInr},
          unless law requires otherwise.
        </p>
      </LegalSection>

      <LegalSection title="12. Indemnity">
        <p>
          You will indemnify {LEGAL.brandName} against claims arising from your misuse of the Site, your content, or
          your breach of these Terms.
        </p>
      </LegalSection>

      <LegalSection title="13. Privacy">
        <p>
          Our{' '}
          <Link to="/privacy" className="text-primary font-semibold hover:underline">
            Privacy Policy
          </Link>{' '}
          explains how we handle personal data. By using the Site, you acknowledge that policy.
        </p>
      </LegalSection>

      <LegalSection title="14. Changes">
        <p>
          We may modify these Terms and post updates on the Site. Continued use after changes constitutes acceptance
          where permitted by law.
        </p>
      </LegalSection>

      <LegalSection title="15. Governing law and disputes">
        <p>
          These Terms are governed by the laws of <strong>India</strong>. Courts in <strong>{LEGAL.jurisdiction}</strong>{' '}
          have exclusive jurisdiction, subject to mandatory consumer protections in your place of residence.
        </p>
      </LegalSection>

      <LegalSection title="16. Contact">
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
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
