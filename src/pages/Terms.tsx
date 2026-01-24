import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ScrollArea } from "@/components/ui/scroll-area";

const Terms = () => {
  const sections = [
    { id: "services", title: "1. Our Services" },
    { id: "intellectual-property", title: "2. Intellectual Property Rights" },
    { id: "user-representations", title: "3. User Representations" },
    { id: "user-registration", title: "4. User Registration" },
    { id: "purchases-payment", title: "5. Purchases and Payment" },
    { id: "subscriptions", title: "6. Subscriptions" },
    { id: "prohibited-activities", title: "7. Prohibited Activities" },
    { id: "user-contributions", title: "8. User Generated Contributions" },
    { id: "contribution-license", title: "9. Contribution License" },
    { id: "third-party", title: "10. Third-Party Websites and Content" },
    { id: "services-management", title: "11. Services Management" },
    { id: "privacy-policy", title: "12. Privacy Policy" },
    { id: "term-termination", title: "13. Term and Termination" },
    { id: "modifications", title: "14. Modifications and Interruptions" },
    { id: "governing-law", title: "15. Governing Law" },
    { id: "dispute-resolution", title: "16. Dispute Resolution" },
    { id: "corrections", title: "17. Corrections" },
    { id: "disclaimer", title: "18. Disclaimer" },
    { id: "limitations-liability", title: "19. Limitations of Liability" },
    { id: "indemnification", title: "20. Indemnification" },
    { id: "user-data", title: "21. User Data" },
    { id: "electronic-communications", title: "22. Electronic Communications, Transactions and Signatures" },
    { id: "sms-messaging", title: "23. SMS Text Messaging" },
    { id: "miscellaneous", title: "24. Miscellaneous" },
    { id: "ticket-access", title: "25. Ticket Access and Liability" },
    { id: "user-conduct", title: "26. User Conduct and Platform Use" },
    { id: "account-registration", title: "27. Account Registration and Identification" },
    { id: "event-cancellation", title: "28. Event Cancellation and Rescheduling" },
    { id: "event-access", title: "29. Access to Events and Ticket Availability" },
    { id: "contact-us", title: "30. Contact Us" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-2">Terms and Conditions</h1>
          <p className="text-muted-foreground">Last updated March 31, 2024</p>
        </div>

        {/* Agreement Section */}
        <section className="mb-12 p-6 bg-card rounded-lg border border-border">
          <h2 className="text-xl font-semibold text-foreground mb-4">AGREEMENT TO OUR LEGAL TERMS</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>We are GIGPASS ("Company," "we," "us," "our"), a company registered in Ontario, Canada.</p>
            <p>We operate the website gigpass.io (the "Site"), as well as any other related products and services that refer or link to these legal terms (the "Legal Terms") (collectively, the "Services").</p>
            <p>Gigpass provides subscribers with the opportunity to claim tickets to local events via our web platform. You can contact us by email at support@gigpass.io</p>
            <p>These Legal Terms constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you"), and GIGPASS, concerning your access to and use of the Services. You agree that by accessing the Services, you have read, understood, and agreed to be bound by all of these Legal Terms. IF YOU DO NOT AGREE WITH ALL OF THESE LEGAL TERMS, THEN YOU ARE EXPRESSLY PROHIBITED FROM USING THE SERVICES AND YOU MUST DISCONTINUE USE IMMEDIATELY.</p>
            <p>We will provide you with prior notice of any scheduled changes to the Services you are using. The modified Legal Terms will become effective upon posting or notifying you by support@gigpass.io, as stated in the email message. By continuing to use the Services after the effective date of any changes, you agree to be bound by the modified terms.</p>
            <p>The Services are intended for users who are at least 18 years old. Persons under the age of 18 are not permitted to use or register for the Services.</p>
            <p>We recommend that you print a copy of these Legal Terms for your records.</p>
          </div>
        </section>

        {/* Table of Contents */}
        <section className="mb-12 p-6 bg-card rounded-lg border border-border">
          <h2 className="text-xl font-semibold text-foreground mb-4">TABLE OF CONTENTS</h2>
          <nav className="grid md:grid-cols-2 gap-2">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="text-primary hover:text-primary/80 transition-colors text-sm"
              >
                {section.title}
              </a>
            ))}
          </nav>
        </section>

        {/* Content Sections */}
        <div className="space-y-12">
          <section id="services" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. OUR SERVICES</h2>
            <p className="text-muted-foreground">The information provided when using the Services is not intended for distribution to or use by any person or entity in any jurisdiction or country where such distribution or use would be contrary to law or regulation or which would subject us to any registration requirement within such jurisdiction or country. Accordingly, those persons who choose to access the Services from other locations do so on their own initiative and are solely responsible for compliance with local laws, if and to the extent local laws are applicable.</p>
          </section>

          <section id="intellectual-property" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. INTELLECTUAL PROPERTY RIGHTS</h2>
            <div className="space-y-4 text-muted-foreground">
              <h3 className="text-lg font-medium text-foreground">Our intellectual property</h3>
              <p>We are the owner or the licensee of all intellectual property rights in our Services, including all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics in the Services (collectively, the "Content"), as well as the trademarks, service marks, and logos contained therein (the "Marks").</p>
              <p>Our Content and Marks are protected by copyright and trademark laws (and various other intellectual property rights and unfair competition laws) and treaties in the United States and around the world.</p>
              <p>The Content and Marks are provided in or through the Services "AS IS" for your personal, non-commercial use only.</p>
              
              <h3 className="text-lg font-medium text-foreground mt-6">Your use of our Services</h3>
              <p>Subject to your compliance with these Legal Terms, including the "PROHIBITED ACTIVITIES" section below, we grant you a non-exclusive, non-transferable, revocable license to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>access the Services; and</li>
                <li>download or print a copy of any portion of the Content to which you have properly gained access.</li>
              </ul>
              <p>solely for your personal, non-commercial use.</p>
              <p>Except as set out in this section or elsewhere in our Legal Terms, no part of the Services and no Content or Marks may be copied, reproduced, aggregated, republished, uploaded, posted, publicly displayed, encoded, translated, transmitted, distributed, sold, licensed, or otherwise exploited for any commercial purpose whatsoever, without our express prior written permission.</p>
              <p>If you wish to make any use of the Services, Content, or Marks other than as set out in this section or elsewhere in our Legal Terms, please address your request to: support@gigpass.io. If we ever grant you the permission to post, reproduce, or publicly display any part of our Services or Content, you must identify us as the owners or licensors of the Services, Content, or Marks and ensure that any copyright or proprietary notice appears or is visible on posting, reproducing, or displaying our Content.</p>
              <p>We reserve all rights not expressly granted to you in and to the Services, Content, and Marks.</p>
              <p>Any breach of these Intellectual Property Rights will constitute a material breach of our Legal Terms and your right to use our services will terminate immediately.</p>
              
              <h3 className="text-lg font-medium text-foreground mt-6">Your submissions</h3>
              <p>Please review this section and the "PROHIBITED ACTIVITIES" section carefully prior to using our Services to understand the (a) rights you give us and (b) obligations you have when you post or upload any content through the Services.</p>
              <p><strong>Submissions:</strong> By directly sending us any question, comment, suggestion, idea, feedback, or other information about the Services ("Submissions"), you agree to assign to us all intellectual property rights in such Submission. You agree that we shall own this Submission and be entitled to its unrestricted use and dissemination for any lawful purpose, commercial or otherwise, without acknowledgment or compensation to you.</p>
              <p>You are responsible for what you post or upload: By sending us Submissions through any part of the Services you:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>confirm that you have read and agree with our "PROHIBITED ACTIVITIES" and will not post, send, publish, upload, or transmit through the Services any Submission that is illegal, harassing, hateful, harmful, defamatory, obscene, bullying, abusive, discriminatory, threatening to any person or group, sexually explicit, false, inaccurate, deceitful, or misleading;</li>
                <li>to the extent permissible by applicable law, waive any and all moral rights to any such Submission;</li>
                <li>warrant that any such Submission are original to you or that you have the necessary rights and licenses to submit such Submissions and that you have full authority to grant us the above-mentioned rights in relation to your submissions; and</li>
                <li>warrant and represent that your Submissions do not constitute confidential information.</li>
              </ul>
              <p>You are solely responsible for your Submissions and you expressly agree to reimburse us for any and all losses that we may suffer because of your breach of (a) this section, (b) any third party's intellectual property rights, or (c) applicable law.</p>
            </div>
          </section>

          <section id="user-representations" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. USER REPRESENTATIONS</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>By using the Services, you represent and warrant that: (1) all registration information you submit will be true, accurate, current, and complete; (2) you will maintain the accuracy of such information and promptly update such registration information as necessary; (3) you have the legal capacity and you agree to comply with these Legal Terms; (4) you are not a minor in the jurisdiction in which you reside; (5) you will not access the Services through automated or non-human means, whether through automated script or otherwise; (6) you will not use the Services for any illegal or unauthorized purpose; and (7) your use of the Services will not violate any applicable law or regulation.</p>
              <p>If you provide any information that is untrue, inaccurate, not current, or incomplete, we have the right to suspend or terminate your account and refuse any and all current or future use of the Services (or any portion thereof).</p>
            </div>
          </section>

          <section id="user-registration" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. USER REGISTRATION</h2>
            <p className="text-muted-foreground">You may be required to register to use the Services. You agree to keep your password confidential and will be responsible for all use of your account and password. We reserve the right to remove, reclaim, or change a username you select if we determine, in our sole discretion, that such username is inappropriate, obscene, or otherwise objectionable.</p>
          </section>

          <section id="purchases-payment" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. PURCHASES AND PAYMENT</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>We accept the following forms of payment:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Visa</li>
                <li>Mastercard</li>
                <li>American Express</li>
              </ul>
              <p>You agree to provide current, complete, and accurate purchase and account information for all purchases made via the Services. You further agree to promptly update account and payment information, including email address, payment method, and payment card expiration date, so that we can complete your transactions and contact you as needed. Sales tax will be added to the price of purchases as deemed required by us. We may change prices at any time. All payments shall be in Canadian Dollars.</p>
              <p>You agree to pay all charges at the prices then in effect for your purchases and any applicable shipping fees, and you authorize us to charge your chosen payment provider for any such amounts upon placing your order. We reserve the right to correct any errors or mistakes in pricing, even if we have already requested or received payment.</p>
              <p>We reserve the right to refuse any order placed through the Services. We may, in our sole discretion, limit or cancel quantities purchased per person, per household, or per order. These restrictions may include orders placed by or under the same customer account, the same payment method, and/or orders that use the same billing or shipping address. We reserve the right to limit or prohibit orders that, in our sole judgment, appear to be placed by dealers, resellers, or distributors.</p>
            </div>
          </section>

          <section id="subscriptions" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. SUBSCRIPTIONS</h2>
            <div className="space-y-4 text-muted-foreground">
              <h3 className="text-lg font-medium text-foreground">Billing and Renewal</h3>
              <p>Your subscription will continue and automatically renew unless canceled. You consent to our charging your payment method on a recurring basis without requiring your prior approval for each recurring charge, until such time as you cancel the applicable order. The length of your billing cycle is monthly.</p>
              
              <h3 className="text-lg font-medium text-foreground mt-6">Cancellation</h3>
              <p>You can cancel your subscription at any time by logging into your account. Your cancellation will take effect at the end of the current paid term. If you have any questions or are unsatisfied with our Services, please email us at support@gigpass.io.</p>
              
              <h3 className="text-lg font-medium text-foreground mt-6">Fee Changes</h3>
              <p>We may, from time to time, make changes to the subscription fee and will communicate any price changes to you in accordance with applicable law.</p>
            </div>
          </section>

          <section id="prohibited-activities" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. PROHIBITED ACTIVITIES</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>You may not access or use the Services for any purpose other than that for which we make the Services available. The Services may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us.</p>
              <p>As a user of the Services, you agree not to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Systematically retrieve data or other content from the Service to create or compile, directly or indirectly, a collection, compilation, database, or directory without written permission from us.</li>
                <li>Trick, defraud, or mislead us and other users, especially in any attempt to learn sensitive account information such as user passwords.</li>
                <li>Circumvent, disable, or otherwise interfere with security-related features of the Services, including features that prevent or restrict the use or copying of any Content or enforce limitations on the use of the Services and/or the Content contained therein.</li>
                <li>Disparage, tarnish, or otherwise harm, in our opinion, us and/or the Services.</li>
                <li>Use any information obtained from the Services in order to harass, abuse, or harm another person.</li>
                <li>Make improper use of our support services or submit false reports of abuse or misconduct.</li>
                <li>Use the Services in a manner inconsistent with any applicable laws or regulations.</li>
                <li>Engage in unauthorized framing of or linking to the Services.</li>
                <li>Upload or transmit (or attempt to upload or to transmit) viruses, Trojan horses, or other material, including excessive use of capital letters and spamming (continuous posting of repetitive text), that interferes with any party's uninterrupted use and enjoyment of the Services or modifies, impairs, disrupts, alters, or interferes with the use, features, functions, operation, or maintenance of the Services.</li>
                <li>Engage in any automated use of the system, such as using scripts to send comments or messages, or using any data mining, robots, or similar data gathering and extraction tools.</li>
                <li>Delete the copyright or other proprietary rights notice from any Content.</li>
                <li>Attempt to impersonate another user or person or use the username of another user.</li>
                <li>Upload or transmit (or attempt to upload or to transmit) any material that acts as a passive or active information collection or transmission mechanism, including without limitation, clear graphics interchange formats ("gifs"), 1x1 pixels, web bugs, cookies, or other similar devices (sometimes referred to as "spyware" or "passive collection mechanisms" or "pcms").</li>
                <li>Interfere with, disrupt, or create an undue burden on the Services or the networks or services connected to the Services.</li>
                <li>Harass, annoy, intimidate, or threaten any of our employees or agents engaged in providing any portion of the Services to you.</li>
                <li>Attempt to bypass any measures of the Services designed to prevent or restrict access to the Services, or any portion of the Services.</li>
                <li>Copy or adapt the Services' software, including but not limited to Flash, PHP, HTML, JavaScript, or other code.</li>
                <li>Except as permitted by applicable law, decipher, decompile, disassemble, or reverse engineer any of the software comprising or in any way making up a part of the Services.</li>
                <li>Except as may be the result of standard search engine or Internet browser usage, use, launch, develop, or distribute any automated system, including without limitation, any spider, robot, cheat utility, scraper, or offline reader that accesses the Services, or use or launch any unauthorized script or other software.</li>
                <li>Use a buying agent or purchasing agent to make purchases on the Services.</li>
                <li>Make any unauthorized use of the Services, including collecting usernames and/or email addresses of users by electronic or other means for the purpose of sending unsolicited email, or creating user accounts by automated means or under false pretenses.</li>
                <li>Use the Services as part of any effort to compete with us or otherwise use the Services and/or the Content for any revenue-generating endeavor or commercial enterprise.</li>
                <li>Use the Services to advertise or offer to sell goods and services.</li>
                <li>Sell or otherwise transfer your profile.</li>
                <li>Sell or transfer tickets claimed through our platform.</li>
                <li>Try to circumvent the limitations put by the platform to claim more tickets than allowed.</li>
              </ul>
            </div>
          </section>

          <section id="user-contributions" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. USER GENERATED CONTRIBUTIONS</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>The Services does not offer users to submit or post content. We may provide you with the opportunity to create, submit, post, display, transmit, perform, publish, distribute, or broadcast content and materials to us or on the Services, including but not limited to text, writings, video, audio, photographs, graphics, comments, suggestions, or personal information or other material (collectively, "Contributions"). Contributions may be viewable by other users of the Services and through third-party websites. As such, any Contributions you transmit may be treated in accordance with the Services' Privacy Policy. When you create or make available any Contributions, you thereby represent and warrant that:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>The creation, distribution, transmission, public display, or performance, and the accessing, downloading, or copying of your Contributions do not and will not infringe the proprietary rights, including but not limited to the copyright, patent, trademark, trade secret, or moral rights of any third party.</li>
                <li>You are the creator and owner of or have the necessary licenses, rights, consents, releases, and permissions to use and to authorize us, the Services, and other users of the Services to use your Contributions in any manner contemplated by the Services and these Legal Terms.</li>
                <li>You have the written consent, release, and/or permission of each and every identifiable individual person in your Contributions to use the name or likeness of each and every such identifiable individual person to enable inclusion and use of your Contributions in any manner contemplated by the Services and these Legal Terms.</li>
                <li>Your Contributions are not false, inaccurate, or misleading.</li>
                <li>Your Contributions are not unsolicited or unauthorized advertising, promotional materials, pyramid schemes, chain letters, spam, mass mailings, or other forms of solicitation.</li>
                <li>Your Contributions are not obscene, lewd, lascivious, filthy, violent, harassing, libelous, slanderous, or otherwise objectionable (as determined by us).</li>
                <li>Your Contributions do not ridicule, mock, disparage, intimidate, or abuse anyone.</li>
                <li>Your Contributions are not used to harass or threaten (in the legal sense of those terms) any other person and to promote violence against a specific person or class of people.</li>
                <li>Your Contributions do not violate any applicable law, regulation, or rule.</li>
                <li>Your Contributions do not violate the privacy or publicity rights of any third party.</li>
                <li>Your Contributions do not violate any applicable law concerning child pornography, or otherwise intended to protect the health or well-being of minors.</li>
                <li>Your Contributions do not include any offensive comments that are connected to race, national origin, gender, sexual preference, or physical handicap.</li>
                <li>Your Contributions do not otherwise violate, or link to material that violates, any provision of these Legal Terms, or any applicable law or regulation.</li>
              </ul>
              <p>Any use of the Services in violation of the foregoing violates these Legal Terms and may result in, among other things, termination or suspension of your rights to use the Services.</p>
            </div>
          </section>

          <section id="contribution-license" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">9. CONTRIBUTION LICENSE</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>You and Services agree that we may access, store, process, and use any information and personal data that you provide following the terms of the Privacy Policy and your choices (including settings).</p>
              <p>By submitting suggestions or other feedback regarding the Services, you agree that we can use and share such feedback for any purpose without compensation to you.</p>
              <p>We do not assert any ownership over your Contributions. You retain full ownership of all of your Contributions and any intellectual property rights or other proprietary rights associated with your Contributions. We are not liable for any statements or representations in your Contributions provided by you in any area on the Services. You are solely responsible for your Contributions to the Services and you expressly agree to exonerate us from any and all responsibility and to refrain from any legal action against us regarding your Contributions.</p>
            </div>
          </section>

          <section id="third-party" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">10. THIRD-PARTY WEBSITES AND CONTENT</h2>
            <p className="text-muted-foreground">The Services may contain (or you may be sent via the Site) links to other websites ("Third-Party Websites") as well as articles, photographs, text, graphics, pictures, designs, music, sound, video, information, applications, software, and other content or items belonging to or originating from third parties ("Third-Party Content"). Such Third-Party Websites and Third-Party Content are not investigated, monitored, or checked for accuracy, appropriateness, or completeness by us, and we are not responsible for any Third-Party Websites accessed through the Services or any Third-Party Content posted on, available through, or installed from the Services, including the content, accuracy, offensiveness, opinions, reliability, privacy practices, or other policies of or contained in the Third-Party Websites or the Third-Party Content. Inclusion of, linking to, or permitting the use or installation of any Third-Party Websites or any Third-Party Content does not imply approval or endorsement thereof by us. If you decide to leave the Services and access the Third-Party Websites or to use or install any Third-Party Content, you do so at your own risk, and you should be aware these Legal Terms no longer govern. You should review the applicable terms and policies, including privacy and data gathering practices, of any website to which you navigate from the Services or relating to any applications you use or install from the Services. Any purchases you make through Third-Party Websites will be through other websites and from other companies, and we take no responsibility whatsoever in relation to such purchases which are exclusively between you and the applicable third party. You agree and acknowledge that we do not endorse the products or services offered on Third-Party Websites and you shall hold us blameless from any harm caused by your purchase of such products or services. Additionally, you shall hold us blameless from any losses sustained by you or harm caused to you relating to or resulting in any way from any Third-Party Content or any contact with Third-Party Websites.</p>
          </section>

          <section id="services-management" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">11. SERVICES MANAGEMENT</h2>
            <p className="text-muted-foreground">We reserve the right, but not the obligation, to: (1) monitor the Services for violations of these Legal Terms; (2) take appropriate legal action against anyone who, in our sole discretion, violates the law or these Legal Terms, including without limitation, reporting such user to law enforcement authorities; (3) in our sole discretion and without limitation, refuse, restrict access to, limit the availability of, or disable (to the extent technologically feasible) any of your Contributions or any portion thereof; (4) in our sole discretion and without limitation, notice, or liability, to remove from the Services or otherwise disable all files and content that are excessive in size or are in any way burdensome to our systems; and (5) otherwise manage the Services in a manner designed to protect our rights and property and to facilitate the proper functioning of the Services.</p>
          </section>

          <section id="privacy-policy" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">12. PRIVACY POLICY</h2>
            <p className="text-muted-foreground">We care about data privacy and security. Please review our Privacy Policy: https://gigpass.io/privacy-policy. By using the Services, you agree to be bound by our Privacy Policy, which is incorporated into these Legal Terms. Please be advised the Services are hosted in Canada and United States. If you access the Services from any other region of the world with laws or other requirements governing personal data collection, use, or disclosure that differ from applicable laws in Canada and United States, then through your continued use of the Services, you are transferring your data to Canada and United States, and you expressly consent to have your data transferred to and processed in Canada and United States.</p>
          </section>

          <section id="term-termination" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">13. TERM AND TERMINATION</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>These Legal Terms shall remain in full force and effect while you use the Services. WITHOUT LIMITING ANY OTHER PROVISION OF THESE LEGAL TERMS, WE RESERVE THE RIGHT TO, IN OUR SOLE DISCRETION AND WITHOUT NOTICE OR LIABILITY, DENY ACCESS TO AND USE OF THE SERVICES (INCLUDING BLOCKING CERTAIN IP ADDRESSES), TO ANY PERSON FOR ANY REASON OR FOR NO REASON, INCLUDING WITHOUT LIMITATION FOR BREACH OF ANY REPRESENTATION, WARRANTY, OR COVENANT CONTAINED IN THESE LEGAL TERMS OR OF ANY APPLICABLE LAW OR REGULATION. WE MAY TERMINATE YOUR USE OR PARTICIPATION IN THE SERVICES OR DELETE YOUR ACCOUNT AND ANY CONTENT OR INFORMATION THAT YOU POSTED AT ANY TIME, WITHOUT WARNING, IN OUR SOLE DISCRETION.</p>
              <p>If we terminate or suspend your account for any reason, you are prohibited from registering and creating a new account under your name, a fake or borrowed name, or the name of any third party, even if you may be acting on behalf of the third party. In addition to terminating or suspending your account, we reserve the right to take appropriate legal action, including without limitation pursuing civil, criminal, and injunctive redress.</p>
            </div>
          </section>

          <section id="modifications" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">14. MODIFICATIONS AND INTERRUPTIONS</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>We reserve the right to change, modify, or remove the contents of the Services at any time or for any reason at our sole discretion without notice. However, we have no obligation to update any information on our Services. We will not be liable to you or any third party for any modification, price change, suspension, or discontinuance of the Services.</p>
              <p>We cannot guarantee the Services will be available at all times. We may experience hardware, software, or other problems or need to perform maintenance related to the Services, resulting in interruptions, delays, or errors. We reserve the right to change, revise, update, suspend, discontinue, or otherwise modify the Services at any time or for any reason without notice to you. You agree that we have no liability whatsoever for any loss, damage, or inconvenience caused by your inability to access or use the Services during any downtime or discontinuance of the Services. Nothing in these Legal Terms will be construed to obligate us to maintain and support the Services or to supply any corrections, updates, or releases in connection therewith.</p>
            </div>
          </section>

          <section id="governing-law" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">15. GOVERNING LAW</h2>
            <p className="text-muted-foreground">These Legal Terms shall be governed by and defined following the laws of Canada. GIGPASS and yourself irrevocably consent that the courts of Canada shall have exclusive jurisdiction to resolve any dispute which may arise in connection with these Legal Terms.</p>
          </section>

          <section id="dispute-resolution" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">16. DISPUTE RESOLUTION</h2>
            <div className="space-y-4 text-muted-foreground">
              <h3 className="text-lg font-medium text-foreground">Informal Negotiations</h3>
              <p>To expedite resolution and control the cost of any dispute, controversy, or claim related to these Legal Terms (each a "Dispute" and collectively, the "Disputes") brought by either you or us (individually, a "Party" and collectively, the "Parties"), the Parties agree to first attempt to negotiate any Dispute (except those Disputes expressly provided below) informally for at least thirty (30) days before initiating arbitration. Such informal negotiations commence upon written notice from one Party to the other Party.</p>
              
              <h3 className="text-lg font-medium text-foreground mt-6">Binding Arbitration</h3>
              <p>Any dispute arising out of or in connection with these Legal Terms, including any question regarding its existence, validity, or termination, shall be referred to and finally resolved by the International Commercial Arbitration Court under the European Arbitration Chamber (Belgium, Brussels, Avenue Louise, 146) according to the Rules of this ICAC, which, as a result of referring to it, is considered as the part of this clause. The number of arbitrators shall be three (3). The seat, or legal place, of arbitration shall be Toronto, Canada. The language of the proceedings shall be English. The governing law of these Legal Terms shall be substantive law of Canada.</p>
              
              <h3 className="text-lg font-medium text-foreground mt-6">Restrictions</h3>
              <p>The Parties agree that any arbitration shall be limited to the Dispute between the Parties individually. To the full extent permitted by law, (a) no arbitration shall be joined with any other proceeding; (b) there is no right or authority for any Dispute to be arbitrated on a class-action basis or to utilize class action procedures; and (c) there is no right or authority for any Dispute to be brought in a purported representative capacity on behalf of the general public or any other persons.</p>
              
              <h3 className="text-lg font-medium text-foreground mt-6">Exceptions to Informal Negotiations and Arbitration</h3>
              <p>The Parties agree that the following Disputes are not subject to the above provisions concerning informal negotiations and binding arbitration: (a) any Disputes seeking to enforce or protect, or concerning the validity of, any of the intellectual property rights of a Party; (b) any Dispute related to, or arising from, allegations of theft, piracy, invasion of privacy, or unauthorized use; and (c) any claim for injunctive relief. If this provision is found to be illegal or unenforceable, then neither Party will elect to arbitrate any Dispute falling within that portion of this provision found to be illegal or unenforceable and such Dispute shall be decided by a court of competent jurisdiction within the courts listed for jurisdiction above, and the Parties agree to submit to the personal jurisdiction of that court.</p>
            </div>
          </section>

          <section id="corrections" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">17. CORRECTIONS</h2>
            <p className="text-muted-foreground">There may be information on the Services that contains typographical errors, inaccuracies, or omissions, including descriptions, pricing, availability, and various other information. We reserve the right to correct any errors, inaccuracies, or omissions and to change or update the information on the Services at any time, without prior notice.</p>
          </section>

          <section id="disclaimer" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">18. DISCLAIMER</h2>
            <p className="text-muted-foreground uppercase">THE SERVICES ARE PROVIDED ON AN AS-IS AND AS-AVAILABLE BASIS. YOU AGREE THAT YOUR USE OF THE SERVICES WILL BE AT YOUR SOLE RISK. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, IN CONNECTION WITH THE SERVICES AND YOUR USE THEREOF, INCLUDING, WITHOUT LIMITATION, THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE MAKE NO WARRANTIES OR REPRESENTATIONS ABOUT THE ACCURACY OR COMPLETENESS OF THE SERVICES' CONTENT OR THE CONTENT OF ANY WEBSITES OR MOBILE APPLICATIONS LINKED TO THE SERVICES AND WE WILL ASSUME NO LIABILITY OR RESPONSIBILITY FOR ANY (1) ERRORS, MISTAKES, OR INACCURACIES OF CONTENT AND MATERIALS, (2) PERSONAL INJURY OR PROPERTY DAMAGE, OF ANY NATURE WHATSOEVER, RESULTING FROM YOUR ACCESS TO AND USE OF THE SERVICES, (3) ANY UNAUTHORIZED ACCESS TO OR USE OF OUR SECURE SERVERS AND/OR ANY AND ALL PERSONAL INFORMATION AND/OR FINANCIAL INFORMATION STORED THEREIN, (4) ANY INTERRUPTION OR CESSATION OF TRANSMISSION TO OR FROM THE SERVICES, (5) ANY BUGS, VIRUSES, TROJAN HORSES, OR THE LIKE WHICH MAY BE TRANSMITTED TO OR THROUGH THE SERVICES BY ANY THIRD PARTY, AND/OR (6) ANY ERRORS OR OMISSIONS IN ANY CONTENT AND MATERIALS OR FOR ANY LOSS OR DAMAGE OF ANY KIND INCURRED AS A RESULT OF THE USE OF ANY CONTENT POSTED, TRANSMITTED, OR OTHERWISE MADE AVAILABLE VIA THE SERVICES. WE DO NOT WARRANT, ENDORSE, GUARANTEE, OR ASSUME RESPONSIBILITY FOR ANY PRODUCT OR SERVICE ADVERTISED OR OFFERED BY A THIRD PARTY THROUGH THE SERVICES, ANY HYPERLINKED WEBSITE, OR ANY WEBSITE OR MOBILE APPLICATION FEATURED IN ANY BANNER OR OTHER ADVERTISING, AND WE WILL NOT BE A PARTY TO OR IN ANY WAY BE RESPONSIBLE FOR MONITORING ANY TRANSACTION BETWEEN YOU AND ANY THIRD-PARTY PROVIDERS OF PRODUCTS OR SERVICES. AS WITH THE PURCHASE OF A PRODUCT OR SERVICE THROUGH ANY MEDIUM OR IN ANY ENVIRONMENT, YOU SHOULD USE YOUR BEST JUDGMENT AND EXERCISE CAUTION WHERE APPROPRIATE.</p>
          </section>

          <section id="limitations-liability" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">19. LIMITATIONS OF LIABILITY</h2>
            <p className="text-muted-foreground uppercase">IN NO EVENT WILL WE OR OUR DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE TO YOU OR ANY THIRD PARTY FOR ANY DIRECT, INDIRECT, CONSEQUENTIAL, EXEMPLARY, INCIDENTAL, SPECIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFIT, LOST REVENUE, LOSS OF DATA, OR OTHER DAMAGES ARISING FROM YOUR USE OF THE SERVICES, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. NOTWITHSTANDING ANYTHING TO THE CONTRARY CONTAINED HEREIN, OUR LIABILITY TO YOU FOR ANY CAUSE WHATSOEVER AND REGARDLESS OF THE FORM OF THE ACTION, WILL AT ALL TIMES BE LIMITED TO THE AMOUNT PAID, IF ANY, BY YOU TO US DURING THE SIX (6) MONTH PERIOD PRIOR TO ANY CAUSE OF ACTION ARISING. CERTAIN US STATE LAWS AND INTERNATIONAL LAWS DO NOT ALLOW LIMITATIONS ON IMPLIED WARRANTIES OR THE EXCLUSION OR LIMITATION OF CERTAIN DAMAGES. IF THESE LAWS APPLY TO YOU, SOME OR ALL OF THE ABOVE DISCLAIMERS OR LIMITATIONS MAY NOT APPLY TO YOU, AND YOU MAY HAVE ADDITIONAL RIGHTS.</p>
          </section>

          <section id="indemnification" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">20. INDEMNIFICATION</h2>
            <p className="text-muted-foreground">You agree to defend, indemnify, and hold us harmless, including our subsidiaries, affiliates, and all of our respective officers, agents, partners, and employees, from and against any loss, damage, liability, claim, or demand, including reasonable attorneys' fees and expenses, made by any third party due to or arising out of: (1) use of the Services; (2) breach of these Legal Terms; (3) any breach of your representations and warranties set forth in these Legal Terms; (4) your violation of the rights of a third party, including but not limited to intellectual property rights; or (5) any overt harmful act toward any other user of the Services with whom you connected via the Services. Notwithstanding the foregoing, we reserve the right, at your expense, to assume the exclusive defense and control of any matter for which you are required to indemnify us, and you agree to cooperate, at your expense, with our defense of such claims. We will use reasonable efforts to notify you of any such claim, action, or proceeding which is subject to this indemnification upon becoming aware of it.</p>
          </section>

          <section id="user-data" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">21. USER DATA</h2>
            <p className="text-muted-foreground">We will maintain certain data that you transmit to the Services for the purpose of managing the performance of the Services, as well as data relating to your use of the Services. Although we perform regular routine backups of data, you are solely responsible for all data that you transmit or that relates to any activity you have undertaken using the Services. You agree that we shall have no liability to you for any loss or corruption of any such data, and you hereby waive any right of action against us arising from any such loss or corruption of such data.</p>
          </section>

          <section id="electronic-communications" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">22. ELECTRONIC COMMUNICATIONS, TRANSACTIONS, AND SIGNATURES</h2>
            <p className="text-muted-foreground">Visiting the Services, sending us emails, and completing online forms constitute electronic communications. You consent to receive electronic communications, and you agree that all agreements, notices, disclosures, and other communications we provide to you electronically, via email and on the Services, satisfy any legal requirement that such communication be in writing. YOU HEREBY AGREE TO THE USE OF ELECTRONIC SIGNATURES, CONTRACTS, ORDERS, AND OTHER RECORDS, AND TO ELECTRONIC DELIVERY OF NOTICES, POLICIES, AND RECORDS OF TRANSACTIONS INITIATED OR COMPLETED BY US OR VIA THE SERVICES. You hereby waive any rights or requirements under any statutes, regulations, rules, ordinances, or other laws in any jurisdiction which require an original signature or delivery or retention of non-electronic records, or to payments or the granting of credits by any means other than electronic means.</p>
          </section>

          <section id="sms-messaging" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">23. SMS TEXT MESSAGING</h2>
            <div className="space-y-4 text-muted-foreground">
              <h3 className="text-lg font-medium text-foreground">Opting Out</h3>
              <p>If at any time you wish to stop receiving SMS messages from us, simply reply to the text with "STOP." You may receive an SMS message confirming your opt out.</p>
              
              <h3 className="text-lg font-medium text-foreground mt-6">Message and Data Rates</h3>
              <p>Please be aware that message and data rates may apply to any SMS messages sent or received. The rates are determined by your carrier and the specifics of your mobile plan.</p>
              
              <h3 className="text-lg font-medium text-foreground mt-6">Support</h3>
              <p>If you have any questions or need assistance regarding our SMS communications, please email us at support@gigpass.io</p>
            </div>
          </section>

          <section id="miscellaneous" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">24. MISCELLANEOUS</h2>
            <p className="text-muted-foreground">These Legal Terms and any policies or operating rules posted by us on the Services or in respect to the Services constitute the entire agreement and understanding between you and us. Our failure to exercise or enforce any right or provision of these Legal Terms shall not operate as a waiver of such right or provision. These Legal Terms operate to the fullest extent permissible by law. We may assign any or all of our rights and obligations to others at any time. We shall not be responsible or liable for any loss, damage, delay, or failure to act caused by any cause beyond our reasonable control. If any provision or part of a provision of these Legal Terms is determined to be unlawful, void, or unenforceable, that provision or part of the provision is deemed severable from these Legal Terms and does not affect the validity and enforceability of any remaining provisions. There is no joint venture, partnership, employment or agency relationship created between you and us as a result of these Legal Terms or use of the Services. You agree that these Legal Terms will not be construed against us by virtue of having drafted them. You hereby waive any and all defenses you may have based on the electronic form of these Legal Terms and the lack of signing by the parties hereto to execute these Legal Terms.</p>
          </section>

          <section id="ticket-access" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">25. TICKET ACCESS AND LIABILITY</h2>
            <div className="space-y-4 text-muted-foreground">
              <h3 className="text-lg font-medium text-foreground">Event Relationships</h3>
              <p>Gigpass acts solely as an intermediary platform providing access to tickets for live music events. It is important for all users to understand that Gigpass is not the promoter, booker, organizer, or operator of the events listed on our platform, nor do we own, manage, or control the venues where these events take place, unless stated otherwise.</p>
              
              <h3 className="text-lg font-medium text-foreground mt-6">User Discretion and Responsibility</h3>
              <p>Attendance at any event accessed through Gigpass is entirely at the user's discretion. Users agree to assume all risks associated with event attendance and participation, including but not limited to personal injury and loss of property. It is the user's responsibility to review and understand the terms, conditions, and policies of the specific events and venues, including age restrictions, prohibited items, and code of conduct.</p>
              
              <h3 className="text-lg font-medium text-foreground mt-6">Liability and Indemnification</h3>
              <p>Gigpass shall not be held liable for any incidents, accidents, injuries, or other occurrences that may happen before, during, or after any event. Liability for any such events, including but not limited to personal injury, damage, and loss, rests with the venue, event promoters, organizers, or their respective insurers, not Gigpass. By using the Gigpass platform to access event tickets, users agree to release Gigpass from any claims, demands, damages, losses, liabilities, and expenses arising out of or in connection with their attendance at such events. Users agree to indemnify, defend, and hold harmless Gigpass and its affiliates, officers, agents, and employees from any claims, demands, damages, losses, liabilities, and expenses, including attorneys' fees, arising out of or in connection with your use of our service, your attendance at events, or your violation of these terms. This section does not attempt to limit liability in a manner that is not permissible under applicable law. As always, your statutory rights remain unaffected.</p>
            </div>
          </section>

          <section id="user-conduct" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">26. USER CONDUCT AND PLATFORM USE</h2>
            <div className="space-y-4 text-muted-foreground">
              <h3 className="text-lg font-medium text-foreground">Right to Terminate Access</h3>
              <p>Gigpass reserves the unqualified right to restrict, suspend, or terminate a user's access to our platform at any time, for any reason, at our sole discretion, without prior notice or liability. This action can be taken for conduct that Gigpass deems to be harmful to the platform, its users, its partners, or for actions that violate the letter or spirit of these terms and conditions.</p>
              
              <h3 className="text-lg font-medium text-foreground mt-6">Prohibited Behaviors</h3>
              <p>Prohibited behaviors that may result in a ban include, but are not limited to, the following: (1) Abuse of Our Platform: Engaging in behavior that is harmful, fraudulent, deceptive, threatening, harassing, defamatory, obscene, or otherwise objectionable. (2) Circumventing Platform Limitations: Attempting to bypass any measures we may use to prevent or restrict access to the service, including, but not limited to, creating multiple accounts to evade restrictions or bans. (3) Misuse of Tickets: including scalping, unauthorized resale, or attempt to transfer tickets in a manner that violates these terms. (4) Negative Reports from Events and Promoters: Actions that lead to negative feedback from event promoters, venues, or other partners, including disruptive behavior at events or failure to comply with event-specific rules.</p>
              
              <h3 className="text-lg font-medium text-foreground mt-6">Enforcement and Consequences</h3>
              <p>Our decision to ban or restrict access is final and not subject to external review. Upon termination, the user account will be deactivated, and they may be barred from creating new accounts on the platform. Users who are banned forfeit any subscription fees paid without refund and lose access to any tickets or upcoming events previously obtained through Gigpass. We take these actions seriously and aim to foster a respectful and enjoyable experience for all users, partners, and event attendees. By using Gigpass, you agree to abide by these terms and contribute to a positive live music community.</p>
            </div>
          </section>

          <section id="account-registration" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">27. ACCOUNT REGISTRATION AND IDENTIFICATION</h2>
            <div className="space-y-4 text-muted-foreground">
              <h3 className="text-lg font-medium text-foreground">Requirement for Accurate Information</h3>
              <p>During the signup process for Gigpass, all users are required to provide their first and last name exactly as it appears on their government-issued identification (ID). This requirement is critical to ensure a seamless experience at event entrances, where ID checks may be conducted to verify the identity of the ticket holder. The primary goal of this policy is to prevent ticket sharing and scalping, ensuring that all members have fair access to events.</p>
              
              <h3 className="text-lg font-medium text-foreground mt-6">Name Verification at Events</h3>
              <p>It is important for users to be aware that their government-issued ID might be checked against the name on their ticket at the door of events. This measure is in place to uphold the integrity of the ticketing system and to maintain the exclusivity and security of the event entry process. By providing accurate information that matches their ID, users help facilitate a smooth entry experience for themselves and other attendees.</p>
              
              <h3 className="text-lg font-medium text-foreground mt-6">Changing Account Information</h3>
              <p>We understand that there may be legitimate reasons for needing to change the name associated with a Gigpass account. Should you need to update the name on your account after registration, this can only be done by directly contacting Gigpass support. Our customer service team will assist with the process and may require documentation to verify the name change request. This policy is designed to maintain the security of our platform and to prevent misuse while accommodating genuine needs for account information updates. To contact Gigpass support for a name change or any other assistance, please refer to our support section on the website.</p>
            </div>
          </section>

          <section id="event-cancellation" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">28. EVENT CANCELLATION AND RESCHEDULING</h2>
            <div className="space-y-4 text-muted-foreground">
              <h3 className="text-lg font-medium text-foreground">No Guarantee of Event Occurrence</h3>
              <p>It is important for users to acknowledge that Gigpass does not have control over the events listed on our platform. We do not organize, operate, or bear responsibility for the planning and execution of these events, unless stated otherwise. Consequently, we cannot guarantee that all events will occur as scheduled. Factors beyond our control may necessitate event cancellations or rescheduling.</p>
              
              <h3 className="text-lg font-medium text-foreground mt-6">Handling Cancellations and Rescheduling</h3>
              <p>In the event of a cancellation or rescheduling, Gigpass will address each situation on a case-by-case basis. Our team will communicate with event organizers and promoters to gather information and determine the best course of action for our users. This may include providing information on rescheduled dates or assisting with access to alternative events, subject to availability.</p>
              
              <h3 className="text-lg font-medium text-foreground mt-6">Compensation and Refunds</h3>
              <p>Users must understand that they are not entitled to compensation or refunds from Gigpass for inconveniences or losses resulting from event cancellations or rescheduling. Since Gigpass is not the organizer or operator of any events featured on our platform, our role is limited to facilitating ticket access under the terms agreed upon at the time of subscription. Event cancellations or changes are subject to the policies of the individual organizers or venues, which manage these occurrences independently of Gigpass.</p>
            </div>
          </section>

          <section id="event-access" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">29. ACCESS TO EVENTS AND TICKET AVAILABILITY</h2>
            <div className="space-y-4 text-muted-foreground">
              <h3 className="text-lg font-medium text-foreground">Limited Ticket Quantities</h3>
              <p>Gigpass is committed to providing its users with access to a diverse array of live music events. However, we must clarify that access to every event listed on our website cannot be guaranteed for all subscribers. Each event has a limited number of tickets available through Gigpass, determined by agreements with artists, promoters, and venues. These tickets are offered on a first-come, first-served basis and may be fully claimed by other users.</p>
              
              <h3 className="text-lg font-medium text-foreground mt-6">No Compensation for Fully Claimed Events</h3>
              <p>In instances where tickets for a desired event are fully claimed and unavailable, Gigpass does not offer compensation or refunds. The nature of our service, based on a subscription model, allows for access to multiple events within a billing period, but does not guarantee access to any specific event. We understand the disappointment that may come with missing out on a particular event and encourage our users to explore the wide range of other events available on our platform.</p>
            </div>
          </section>

          <section id="contact-us" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">30. CONTACT US</h2>
            <div className="text-muted-foreground">
              <p>In order to resolve a complaint regarding the Services or to receive further information regarding use of the Services, please contact us at:</p>
              <p className="mt-4 font-medium text-foreground">support@gigpass.io</p>
            </div>
          </section>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Terms;