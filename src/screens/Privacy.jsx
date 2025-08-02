import React, { useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform, // Import Platform for OS-specific styles
  Linking, // Import Linking for handling URLs
} from "react-native";
import Header from "../components/layouts/Header"; // Import your Header component
import { ContextProvider } from "../context/UserProvider";

const { width, height } = Dimensions.get("window");

const Privacy = ({ route, navigation }) => {
  const { userName, userNumber } = route.params || {};
  const [appUser, setAppUser] = useContext(ContextProvider);
  const userId = appUser.userId || {};

  const handleLinkPress = (url) => {
    Linking.openURL(url).catch((err) =>
      console.error("Couldn't load page", err)
    );
  };

  return (
    <SafeAreaView style={styles.blueBackgroundContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0A4B9F" />{" "}
      <Header
        title="Privacy Policy"
        userId={userId}
        userName={userName}
        userNumber={userNumber}
        navigation={navigation}
      />
      <ScrollView
        style={styles.scrollViewStyle} // Controls the background of the scrollable area below the header
        contentContainerStyle={styles.whiteContentContainer} // This is the main neumorphic card
      >
        <View style={styles.innerContentPadding}>
          {" "}
          <Text style={styles.header}>Privacy Policy</Text>
          <View>
            <Text style={styles.paragraph}>
              For the purpose of this privacy policy,{" "}
              <Text style={styles.boldText}>"We"</Text>,{" "}
              <Text style={styles.boldText}>"Us"</Text>,{" "}
              <Text style={styles.boldText}>"Our"</Text>,{" "}
              <Text style={styles.boldText}>"Company"</Text> means VIJAYA
              VINAYAK CHITFUNDS PRIVATE LIMITED and{" "}
              <Text style={styles.boldText}>"You"</Text>,{" "}
              <Text style={styles.boldText}>"Your"</Text> and{" "}
              <Text style={styles.boldText}>"User"</Text> means any person who
              accesses or uses our website/application. This website is owned
              and operated by the Company.
            </Text>
            <Text style={styles.paragraph}>
              This Data Policy applies to{" "}
              <Text
                style={styles.linkText}
                onPress={() => handleLinkPress("https://mychits.co.in/")}
              >
                https://mychits.co.in/
              </Text>
              , the website (<Text style={styles.boldText}>"Website"</Text>) and
              the 'MyChits' Mobile Application (
              <Text style={styles.boldText}>"App"</Text>). This Data Privacy
              Policy describes practices for handling User information collected
              in connection with the services rendered by this Website and App.
            </Text>
            <Text style={styles.paragraph}>
              VIJAYA VINAYAK CHITFUNDS PRIVATE LIMITED and their affiliates are
              committed to protecting and respecting User privacy and providing
              with the information, options and choices necessary for you to
              control how we use your information. This Privacy Policy describes
              how the Website collects and uses personal information to provide
              services operated by or on behalf of the Website/App. This Privacy
              Policy is to be read along with the Terms of Use available at{" "}
              <Text
                style={styles.linkText}
                onPress={() => handleLinkPress("https://mychits.co.in/")}
              >
                https://mychits.co.in/
              </Text>
            </Text>
          </View>
          <Text style={styles.sectionTitle}>This Policy Sets Out:</Text>
          <View>
            <View style={styles.bulletPointContainer}>
              <Text style={styles.bulletIcon}>•</Text>
              <Text style={styles.bulletText}>Collection of Information</Text>
            </View>
            <View style={styles.bulletPointContainer}>
              <Text style={styles.bulletIcon}>•</Text>
              <Text style={styles.bulletText}>Usage of Information</Text>
            </View>
            <View style={styles.bulletPointContainer}>
              <Text style={styles.bulletIcon}>•</Text>
              <Text style={styles.bulletText}>
                Promotional Updates and Communications
              </Text>
            </View>
            <View style={styles.bulletPointContainer}>
              <Text style={styles.bulletIcon}>•</Text>
              <Text style={styles.bulletText}>Information Sharing</Text>
            </View>
            <View style={styles.bulletPointContainer}>
              <Text style={styles.bulletIcon}>•</Text>
              <Text style={styles.bulletText}>Storage of Information</Text>
            </View>
            <View style={styles.bulletPointContainer}>
              <Text style={styles.bulletIcon}>•</Text>
              <Text style={styles.bulletText}>Data Retention</Text>
            </View>
            <View style={styles.bulletPointContainer}>
              <Text style={styles.bulletIcon}>•</Text>
              <Text style={styles.bulletText}>Data Transfers</Text>
            </View>
            <View style={styles.bulletPointContainer}>
              <Text style={styles.bulletIcon}>•</Text>
              <Text style={styles.bulletText}>Amendments to Policy</Text>
            </View>
          </View>
          <Text style={styles.sectionTitle}>Collection of Information</Text>
          <Text style={styles.paragraph}>
            The following information may be collected or received by Us:
          </Text>
          <Text style={styles.subSectionTitle}>
            Direct Sharing of Information by the User:
          </Text>
          <Text style={styles.paragraph}>
            In the course of registering for and availing the various services
            We provide from time to time through the Website/App.We directly
            collect information containing User - name, address, contact number,
            email address and the chit fund(s) that are being subscribed to by
            the User.
          </Text>
          <Text style={styles.paragraph}>
            You acknowledge that You are disclosing User Information
            voluntarily. Prior to the completion of any registration process on
            the Website/App or prior to availing of any services offered on Our
            website. If You wish not to disclose any Personal Information You
            may refrain from doing so; however if You don’t provide information
            that is requested, it is possible that the registration process
            would be incomplete and/or You may not be able to avail of Our
            Services.
          </Text>
          <Text style={styles.subSectionTitle}>
            Information being collected automatically by the Website/App:
          </Text>
          <Text style={styles.paragraph}>
            Internet protocol (IP) address, browser type, mobile device
            identifier, Internet service provider, operating system, pages that
            have been visited before and after using the Website, the date and
            time of visit, information about the links clicked and pages viewed
            within the Website/App, and other standard server log information
            may be collected automatically by visiting the Website/App. The
            Website uses cookies and similar technologies to automatically
            collect this information. By using the Website, you consent to the
            Website's use of cookies and similar technologies.
          </Text>
          <Text style={styles.subSectionTitle}>Device information:</Text>
          <Text style={styles.paragraph}>
            The devices used (mobile phones, computers, tablets, etc.) to access
            Website services such as the hardware models, operation system
            information, software information and version, file names, language
            preferences, IP address cookie information, advertising identifiers,
            browser version, device settings, and mobile network information.
            The Website may recognise Users devices to provide the User with
            personalised experiences and advertising across the services
            available.
          </Text>
          <Text style={styles.subSectionTitle}>Camera & storage:</Text>
          <Text style={styles.paragraph}>
            To upload image or photo and proofs related to KYC and document
            upload.
          </Text>
          <Text style={styles.subSectionTitle}>Location:</Text>
          <Text style={styles.paragraph}>
            MyChits collects and monitors information about the location of your
            device for risk assessment.
          </Text>
          <Text style={styles.subSectionTitle}>Phone:</Text>
          <Text style={styles.paragraph}>
            MyChits collects, monitors, transmits, syncs, and stores specific
            information about your device including storage, hardware model,
            operating system and version, unique device identifier, wi-fi
            information, mobile network information, and information about your
            device's interaction with our service to uniquely identify the
            devices, to ensure that unauthorized devices are not able to act on
            your behalf and to prevent frauds.
          </Text>
          <Text style={styles.subSectionTitle}>Information Sharing:</Text>
          <Text style={styles.paragraph}>
            MyChits will not sell or rent your Information to anyone, for any
            reason, at any time. However, we will be sharing your Information
            with our financial partners, affiliates and business partners, and
            the User hereby consents to the same. We will take reasonable steps
            to ensure that these third-party service providers are obligated to
            protect your information and are also subject to
            confidentiality/non-disclosure obligations and they comply with the
            applicable provisions of the data protection laws.
          </Text>
          <Text style={styles.subSectionTitle}>
            Information received from other sources:
          </Text>
          <View>
            <View style={styles.bulletPointContainer}>
              <Text style={styles.bulletIcon}>•</Text>
              <Text style={styles.bulletText}>
                If there is use of any of the other websites or apps we operate,
                or other services provided by us.
              </Text>
            </View>
            <View style={styles.bulletPointContainer}>
              <Text style={styles.bulletIcon}>•</Text>
              <Text style={styles.bulletText}>
                From third parties through whom the User is able to access or
                register for the services (e.g. where you are able to log in
                with a Google account).
              </Text>
            </View>
            <View style={styles.bulletPointContainer}>
              <Text style={styles.bulletIcon}>•</Text>
              <Text style={styles.bulletText}>
                From third parties that are closely worked with.
              </Text>
            </View>
          </View>
          <Text style={styles.paragraph}>
            In case Website/App receives or collects any such data as
            abovementioned, the User will be informed when such data is being
            collected and if such data is intended to be shared internally
            and/or combined with data automatically collected on this
            Website/App. The purpose of such usage shall also be intimated to
            the User.
          </Text>
          <Text style={styles.paragraph}>
            The Website/App works closely with third parties (including but not
            limited to, business partners, sub-contractors in technical, payment
            services, advertising networks, analytics providers, and search
            information providers). User will be notified when and if the
            Website/App receives information about the User from such third
            parties and the purposes for which Website/App intends to use that
            information.
          </Text>
          <Text style={styles.paragraph}>
            The User may be given the option to access or register for any and
            all services through the use of a user name and password (or any
            other identifier) for certain services provided by third parties
            (each, an <Text style={styles.boldText}>"Integrated Service"</Text>
            ), such as through the use of your Google account, accounts with
            payment systems or wallet providers, or otherwise have the option to
            authorize an integrated service to provide personal data to the
            Website/App. By authorizing the Website/App to connect with an
            Integrated Service, User authorizes Us to access and store User’s
            personal data that the Integrated Service makes available to the
            Website/App, and to use and disclose it in accordance with this
            policy. Please review the terms and conditions of service, terms of
            use and privacy policies of each integrated service carefully before
            using their services and integrating with our services. Please check
            your privacy settings on each integrated device to understand what
            personal data has been integrated with our services.
          </Text>
          <Text style={styles.paragraph}>
            Depending on the nature of dealings with User and/or the services
            provided, the Website/App may collect other types of personal data
            from third parties, including:
          </Text>
          <View>
            <View style={styles.bulletPointContainer}>
              <Text style={styles.bulletIcon}>•</Text>
              <Text style={styles.bulletText}>
                personal data relating to any complaints you make or are made
                about you, including recording of any calls in that regard;
              </Text>
            </View>
            <View style={styles.bulletPointContainer}>
              <Text style={styles.bulletIcon}>•</Text>
              <Text style={styles.bulletText}>
                personal data collected and held via financial or payment
                systems about the payment mechanism or method that you might use
                (including credit card, debit card, upi details, etc.) and the
                payments you may make for our services or any services procured
                or subscribed to using Website and/or App services;
              </Text>
            </View>
            <View style={styles.bulletPointContainer}>
              <Text style={styles.bulletIcon}>•</Text>
              <Text style={styles.bulletText}>
                personal data collected by third-party marketing, survey and
                advertising service providers;
              </Text>
            </View>
            <View style={styles.bulletPointContainer}>
              <Text style={styles.bulletIcon}>•</Text>
              <Text style={styles.bulletText}>
                personal data provided to any partners through which User
                creates or accesses their account for the services, such as
                employee information provided to companies engaging in our
                corporate or other services, payment providers, or services
                integrated with our services, or other websites (such as search
                engines) with which our services have been integrated;
              </Text>
            </View>
            <View style={styles.bulletPointContainer}>
              <Text style={styles.bulletIcon}>•</Text>
              <Text style={styles.bulletText}>
                personal data which is accessible from User use of online sites
                or applications in which the Website/App has an interest (such
                as messages for the purposes of issuing and receiving one-time
                passwords and other device verification) and device-related or
                device-generated personal data. The latter might include User
                device details, device IDs, your location, network connections,
                network access and communication and session data. Location data
                may also be collected or derived from IP addresses, mobile
                numbers and network information.
              </Text>
            </View>
          </View>
          <Text style={styles.sectionTitle}>Usage of Information</Text>
          <Text style={styles.paragraph}>
            Information collected by this Website will help enhance the design
            and implementation of Services on the Website/App. The Services may
            also use information provided by the User to operate and improve the
            functionality of the Service. Apart from this, information
            collected/provided will be used to take steps in order to enter into
            any contract or carry out service obligations arising from any
            contract entered into between User and Us, such as:
          </Text>
          <View>
            <View style={styles.bulletPointContainer}>
              <Text style={styles.bulletIcon}>•</Text>
              <Text style={styles.bulletText}>
                Administering User account within the site;
              </Text>
            </View>
            <View style={styles.bulletPointContainer}>
              <Text style={styles.bulletIcon}>•</Text>
              <Text style={styles.bulletText}>
                Verification of any financial transactions being carried out in
                relation to payments made through the site and/or the App.
              </Text>
            </View>
            <View style={styles.bulletPointContainer}>
              <Text style={styles.bulletIcon}>•</Text>
              <Text style={styles.bulletText}>
                Providing information about available goods and services which
                interests Users for modifying:
                <View style={styles.nestedBulletContainer}>
                  <View style={styles.bulletPointContainer}>
                    <Text style={styles.nestedBulletIcon}>-</Text>
                    <Text style={styles.bulletText}>
                      Manner of presentation of the Contents from the Site in
                      the most effective way.
                    </Text>
                  </View>
                  <View style={styles.bulletPointContainer}>
                    <Text style={styles.nestedBulletIcon}>-</Text>
                    <Text style={styles.bulletText}>
                      Provide information, products and services that are
                      requested from us.
                    </Text>
                  </View>
                </View>
              </Text>
            </View>
          </View>
          <Text style={styles.subSectionTitle}>
            Information collected by User from use of Services:
          </Text>
          <Text style={styles.paragraph}>
            We will use information for their legitimate interests, when
            considered to not be overriding User rights:
          </Text>
          <View>
            <View style={styles.bulletPointContainer}>
              <Text style={styles.bulletIcon}>•</Text>
              <Text style={styles.bulletText}>
                To administer the Services and for internal operations,
                including troubleshooting, data analysis, testing, research,
                statistical and survey purposes.
              </Text>
            </View>
            <View style={styles.bulletPointContainer}>
              <Text style={styles.bulletIcon}>•</Text>
              <Text style={styles.bulletText}>
                To keep the Services safe and secure.
              </Text>
            </View>
            <View style={styles.bulletPointContainer}>
              <Text style={styles.bulletIcon}>•</Text>
              <Text style={styles.bulletText}>
                For measuring or understanding the effectiveness of advertising
                we serve to you and others, and to deliver relevant advertising
                to you.
              </Text>
            </View>
            <View style={styles.bulletPointContainer}>
              <Text style={styles.bulletIcon}>•</Text>
              <Text style={styles.bulletText}>
                To improve the Services to ensure that content is presented in
                the most effective manner for you and for your computer.
              </Text>
            </View>
            <View style={styles.bulletPointContainer}>
              <Text style={styles.bulletIcon}>•</Text>
              <Text style={styles.bulletText}>
                To allow you to participate in interactive features of our
                service, when you choose to do so.
              </Text>
            </View>
          </View>
          <Text style={styles.subSectionTitle}>
            User Information received from other sources:
          </Text>
          <Text style={styles.paragraph}>
            Website will combine such information with information given by the
            User and information collected about User for their legitimate
            interests (where considered that these are not overridden by User
            rights). Such information along with the combined information shall
            be used for the purposes as mentioned above.
          </Text>
          <Text style={styles.sectionTitle}>
            Promotional Updates and Communications
          </Text>
          <Text style={styles.paragraph}>
            Website/App will share promotional updates and communications with
            User consent or, where applicable, in legitimate interest.
          </Text>
          <Text style={styles.paragraph}>
            Where permitted in legitimate interest, Website/App will use User
            personal information for marketing analysis and to provide the User
            with promotional update communications by email, telephone, text
            messages, in-application messages and/or push messages about new
            products and/or services. Website may also share user personal
            information with third-party social media and other partner
            platforms in order to provide you with promotional update
            communications.
          </Text>
          <Text style={styles.paragraph}>
            The User can object to further marketing at any time through their
            profile settings or by selecting the "unsubscribe" link at the end
            of all our marketing and promotional update communications.
          </Text>
          <Text style={styles.paragraph}>
            By using the Website/App and registering yourself, You authorize Us,
            Our affiliates & Our associate partners to contact You via email or
            phone call or SMS and offer You their services for the product You
            have opted for, imparting product knowledge or offer promotional
            offers, as well as for web aggregation. You authorize Us to contact
            You for a period of 90 days from Your registration with Us,
            irrespective of having registered under DND or DNC or NCPR services.
          </Text>
          <Text style={styles.paragraph}>
            Additionally, by registering, You authorize Us to send SMS/email
            alerts to You for Your login details and any other service
            requirements or advertising messages/emails from Us. Further when we
            call you for providing details, you authorize us to record the
            conversation for Quality and Training purposes.
          </Text>
          <Text style={styles.sectionTitle}>Sharing of Information</Text>
          <Text style={styles.paragraph}>
            We may share your information with certain third parties as set
            forth below:
          </Text>
          <Text style={styles.subSectionTitle}>
            Authorized third-party vendors and service providers.
          </Text>
          <Text style={styles.paragraph}>
            The information shared on this website may be shared with
            third-party vendors and service providers who support this
            Website/App, such as by providing technical infrastructure services,
            business analytics, and data processing who process User personal
            data on behalf of the website and in accordance with the applicable
            Data Protection Laws. This includes in supporting the services
            offered through the site and/or the App for: data hosting services,
            providing fulfilment services, distributing and communication being
            sent, supporting or updating marketing lists, facilitating feedback
            on services and providing IT support services from time to time.
          </Text>
          <Text style={styles.paragraph}>
            The information may also be shared with the entities that make up
            the Service Providers (
            <Text style={styles.boldText}>"Partners"</Text>).
          </Text>
          <Text style={styles.paragraph}>
            The information may be shared with any member of the group, which
            mean and include subsidiaries, ultimate holding company and its
            subsidiaries, who support the processing of personal data under this
            policy.
          </Text>
          <Text style={styles.subSectionTitle}>
            Disclosure of information to respond to subpoenas, court orders,
            legal process, law enforcement requests, legal claims or government
            inquiries, detect fraud, and to protect and defend the rights,
            interests, safety, and security of the website, its affiliates,
            owner, users, or the public at large.
          </Text>
          <Text style={styles.paragraph}>
            Apart from this, if bound under any additional duty to disclose or
            share User personal data in order to comply with legal obligations
            or in compulsion of law.
          </Text>
          <Text style={styles.subSectionTitle}>
            Sharing of information in connection with a substantial corporate
            transaction, such as the sale of a website, a merger, consolidation,
            asset sale, or in the unlikely event of bankruptcy that may have
            already been entered into or will enter into future agreements.
          </Text>
          <Text style={styles.subSectionTitle}>
            Sharing of information for any other purposes disclosed to you at
            the time we collect the information and pursuant to your consent for
            the furtherance of any service being rendered on the Website/App.
          </Text>
          <Text style={styles.paragraph}>
            For instance, if you request for services as a customer, then we
            will share only such personal information to facilitate and complete
            the services.
          </Text>
          <Text style={styles.subSectionTitle}>
            Any access to third-party services, is done through the Website/App
            to share information about your experience on the Website/App with
            others;
          </Text>
          <Text style={styles.paragraph}>
            these services are outside the control of the Company. These
            third-party services may be able to collect information about you,
            including information about your activity on the Website/App, and
            they may notify your connections on the third-party services about
            your use of the Website/App, in accordance with their respective
            privacy policies.
          </Text>
          <Text style={styles.paragraph}>
            User Information may also be shared with carefully selected partners
            who may be specifically of interest to the User to fulfil their
            requirements. These companies may contact the User by post, email,
            telephone or fax for marketing or promotional purposes.
          </Text>
          <Text style={styles.paragraph}>
            We will not sell or rent User Information to anyone other than as
            specifically noted herein. Notwithstanding the foregoing, We may
            share, and/or transfer Your User Information to an affiliate and/or
            associate partner, as agreed by You in the Terms of Use and in
            accordance with this policy. We will share User Information if We
            have Your consent or deemed consent to do so or if We are compelled
            by law (including court orders) to do so.
          </Text>
          <Text style={styles.subSectionTitle}>
            Legal obligations for processing Information:
          </Text>
          <Text style={styles.paragraph}>
            The Website/App rely on a variety of legal bases to process data,
            including:
          </Text>
          <View>
            <View style={styles.bulletPointContainer}>
              <Text style={styles.bulletIcon}>•</Text>
              <Text style={styles.bulletText}>
                as necessary to fulfil site Terms;
              </Text>
            </View>
            <View style={styles.bulletPointContainer}>
              <Text style={styles.bulletIcon}>•</Text>
              <Text style={styles.bulletText}>
                consistent with User consent, which the User can revoke at any
                time;
              </Text>
            </View>
            <View style={styles.bulletPointContainer}>
              <Text style={styles.bulletIcon}>•</Text>
              <Text style={styles.bulletText}>
                as necessary to comply with legal obligations;
              </Text>
            </View>
            <View style={styles.bulletPointContainer}>
              <Text style={styles.bulletIcon}>•</Text>
              <Text style={styles.bulletText}>
                to protect Users vital interests, or those of others;
              </Text>
            </View>
            <View style={styles.bulletPointContainer}>
              <Text style={styles.bulletIcon}>•</Text>
              <Text style={styles.bulletText}>
                as necessary in the public interest; and
              </Text>
            </View>
            <View style={styles.bulletPointContainer}>
              <Text style={styles.bulletIcon}>•</Text>
              <Text style={styles.bulletText}>
                as necessary for Website (or others) legitimate interests,
                including any interests in providing an innovative personalized,
                safe and profitable service to User and/or it's partners, unless
                those interests are overridden by User interests or fundamental
                rights or freedoms that require protection of personal data.
              </Text>
            </View>
          </View>
          <Text style={styles.paragraph}>
            Consent to these terms may be withdrawn at any time. Such withdrawal
            of consent will not affect the lawfulness of processing based on
            consent before its withdrawal.
          </Text>
          <Text style={styles.paragraph}>
            Under applicable laws, and in accordance to this policy User has
            the:
          </Text>
          <View>
            <View style={styles.bulletPointContainer}>
              <Text style={styles.bulletIcon}>•</Text>
              <Text style={styles.bulletText}>
                Right to access, rectify, port, and erase the information
                collected by the website,
              </Text>
            </View>
            <View style={styles.bulletPointContainer}>
              <Text style={styles.bulletIcon}>•</Text>
              <Text style={styles.bulletText}>
                Right to restrict and object to certain processing of User
                information.
              </Text>
            </View>
            <View style={styles.bulletPointContainer}>
              <Text style={styles.bulletIcon}>•</Text>
              <Text style={styles.bulletText}>
                Right to withdraw consent - where the processing of User
                personal information by Website is based on consent, User has
                the right to withdraw without detriment at any time.
              </Text>
            </View>
            <View style={styles.bulletPointContainer}>
              <Text style={styles.bulletIcon}>•</Text>
              <Text style={styles.bulletText}>
                Right to object to and restrict certain processing of data which
                includes - the right to object to processing of their data for
                direct marketing, which you can exercise by contacting{" "}
                <Text
                  style={styles.linkText}
                  onPress={() => handleLinkPress("mailto:admin@mychits.co.in")}
                >
                  admin@mychits.co.in
                </Text>
              </Text>
            </View>
            <View style={styles.bulletPointContainer}>
              <Text style={styles.bulletIcon}>•</Text>
              <Text style={styles.bulletText}>
                Right to object to processing of their data where the Company is
                performing a task in the public interest or pursuing their own
                legitimate interests or those of a third party, and
              </Text>
            </View>
            <View style={styles.bulletPointContainer}>
              <Text style={styles.bulletIcon}>•</Text>
              <Text style={styles.bulletText}>
                Right to opt out at any time from allowing further access to
                User personal information and apply to delete the personal
                information stored with Website.
              </Text>
            </View>
          </View>
          <Text style={styles.paragraph}>
            User may delete their information at any time by contacting{" "}
            <Text
              style={styles.linkText}
              onPress={() => handleLinkPress("mailto:admin@mychits.co.in")}
            >
              admin@mychits.co.in
            </Text>
            . All information collected by the Website such as information from
            cookies and information collected with consent under this Policy
            shall be deleted.
          </Text>
          <Text style={styles.sectionTitle}>Storage of Information</Text>
          <Text style={styles.subSectionTitle}>Data Storage:</Text>
          <Text style={styles.paragraph}>
            User acknowledges and agrees that all information, content and data
            entered into the website and/or application will be securely stored
            by the Website/App at designated data centres. We shall use physical
            and technical security measures to protect User Data, including, but
            not limited to, encrypted data connections to designated data
            centers, encrypted data storage, firewalls, and electronic
            surveillance of designated data centers. We have put in place
            appropriate physical, electronic, and managerial procedures to
            safeguard and secure the information We collect online.
          </Text>
          <Text style={styles.subSectionTitle}>Payment:</Text>
          <Text style={styles.paragraph}>
            Payment details provided by the User will be encrypted using secure
            sockets layer (SSL) technology before they are submitted to the
            Website over the internet. Payments made on the Website/App are made
            through Website payment gateway provider Hypto, a data processing
            and payment firm. User will be providing credit or debit card
            information directly to Website payment gateway provider, who
            operate secure servers to process payment details, encrypting User
            credit/debit card information and authorising payment(s).
            Information which you supply to Website payment service providers is
            not within Website control and is subject to the respective
            providers’ own privacy policy and terms and conditions.
          </Text>
          <Text style={styles.subSectionTitle}>Security Disclosure:</Text>
          <Text style={styles.paragraph}>
            The security of User Personal Information is important to us;
            However, User understands that no method of transmission over the
            Internet, or method of electronic storage, is 100% secure. While we
            strive to use commercially acceptable means to protect your Personal
            Information, we cannot guarantee its absolute security.
          </Text>
          <Text style={styles.sectionTitle}>Data Retention</Text>
          <Text style={styles.paragraph}>
            The Website/App shall retain the personal data for:
          </Text>
          <View>
            <View style={styles.bulletPointContainer}>
              <Text style={styles.bulletIcon}>•</Text>
              <Text style={styles.bulletText}>
                as long as user has an account on the Website/App in order to
                meet contractual obligations to the User;
              </Text>
            </View>
            <View style={styles.bulletPointContainer}>
              <Text style={styles.bulletIcon}>•</Text>
              <Text style={styles.bulletText}>
                for a period of 3 (three) months after termination of services
                or closure of account by User in order to identify any issues
                and resolve any legal proceedings. The information can be
                retained for other legal or regulatory requirements.
              </Text>
            </View>
          </View>
          <Text style={styles.paragraph}>
            We may also retain information beyond this time for research
            purposes and to help us develop and improve our services with prior
            permission and intimation.
          </Text>
          <Text style={styles.paragraph}>
            The Website/App generally retains information until it is no longer
            necessary to serve the purposes for which it was collected.
          </Text>
          <Text style={styles.sectionTitle}>Data Transfers</Text>
          <Text style={styles.paragraph}>
            Standard contract clauses are used as approved as per applicable
            laws of the territory of service, for data transfers from one
            country to another.
          </Text>
          <Text style={styles.sectionTitle}>Amendments to Policy</Text>
          <Text style={styles.paragraph}>
            Any changes made to this policy in future will be posted on this
            page and, in relation to any substantive changes, the User shall be
            notified by e-mail. We encourage you to periodically review this
            policy for other latest information on our privacy practices.
          </Text>
          <Text style={[styles.paragraph, styles.lastUpdated]}>
            This policy was last updated on 21/05/2025.
          </Text>
          {/* New content ends here */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  blueBackgroundContainer: {
    flex: 1,
    backgroundColor: "#053B90", // Primary, elegant brand blue for the very top and behind the main scrollable area
    paddingTop: StatusBar.currentHeight || 0,
  },

  scrollViewStyle: {
    flex: 1,
    backgroundColor: "#053B90", // Very light, airy blue-white background for the overall scroll view
  },

  whiteContentContainer: {
    backgroundColor: "#F5F9FF", // Matches scrollView background for seamless neumorphic look
    borderRadius: 30, // Even softer, more inviting edges
    marginHorizontal: width * 0.04, // Keep margin to float content from screen edges
    marginTop: height * 0.02,
    marginBottom: height * 0.04, // Generous space at the bottom of the card

    shadowColor: "rgba(174, 174, 192, 0.5)", // Lighter shadow, more opaque for the "light" source
    shadowOffset: { width: -10, height: -10 }, // Top-left light source
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 10, // Android elevation for base shadow (often simulates one direction of neumorphism)
    borderWidth: 0, // No border for neumorphic smoothness
    ...Platform.select({
      ios: {
        shadowColor: "rgba(94, 104, 121, 0.5)", // Darker shadow, more opaque for the "dark" source
        shadowOffset: { width: 10, height: 10 }, // Bottom-right dark source
        shadowOpacity: 1,
        shadowRadius: 12,
      },
      android: {},
    }),
  },

  innerContentPadding: {
    paddingHorizontal: width * 0.06, // Increased horizontal padding for a more spacious feel
    paddingTop: height * 0.04, // More padding at the top of the content
    paddingBottom: height * 0.1, // Ample space at the bottom for comfortable scrolling
  },

  header: {
    fontSize: width * 0.085, // Even larger and more dominant

    fontWeight: "bold", // Fallback
    color: "#0A4B9F", // Primary brand blue
    marginBottom: height * 0.02, // Consistent space below titles
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 2, // More impactful letter spacing
  },

  sectionTitle: {
    fontSize: width * 0.068, // Slightly larger, clear hierarchy

    fontWeight: "600", // Fallback
    color: "#0A4B9F", // Consistent primary blue
    marginTop: height * 0.05, // More space above sections for clear breaks
    marginBottom: height * 0.018, // Space below section titles
    textAlign: "left",
    textTransform: "capitalize", // Capitalize each word, less aggressive than uppercase
    letterSpacing: 1.3,
    borderBottomWidth: 2, // Slightly thicker, more pronounced bottom border
    borderColor: "#D0E0FF", // Very light blue border
    paddingBottom: height * 0.015, // More padding for border separation
  },

  subSectionTitle: {
    fontSize: width * 0.055, // Smaller than sectionTitle, larger than paragraph
    fontWeight: "bold", // Bold for emphasis
    color: "#0A4B9F", // Primary brand blue
    marginTop: height * 0.03, // Space above sub-sections
    marginBottom: height * 0.01, // Space below sub-sections
    textAlign: "left",
  },

  paragraph: {
    fontSize: width * 0.046, // Slightly larger for better readability
    lineHeight: width * 0.075, // Optimized line height for very comfortable reading
    color: "#333", // Even darker grey for strong contrast and readability
    marginBottom: height * 0.025, // More space between paragraphs
    textAlign: "justify", // Justify text for a clean, block-like appearance

    fontWeight: "400", // Fallback
  },
  boldText: {
    fontWeight: "bold", // Fallback for bolding important text
    color: "#0A4B9F", // Make bold text the brand color for emphasis
  },
  linkText: {
    color: "#007AFF", // Standard blue for links
    textDecorationLine: "underline",
  },
  lastUpdated: {
    textAlign: "right",
    fontSize: width * 0.038,
    marginTop: height * 0.04,
    color: "#666",
  },

  bulletPointContainer: {
    flexDirection: "row",
    alignItems: "flex-start", // Align icon and text at the top
    marginBottom: height * 0.015, // More space between bullet points
    marginLeft: width * 0.02, // Initial indent for the bullet
  },
  bulletIcon: {
    fontSize: width * 0.055, // Slightly larger bullet icon
    color: "#FF8C00", // Vibrant orange for bullet icons
    marginRight: width * 0.025, // More space between bullet icon and text
  },
  bulletText: {
    flex: 1, // Allows text to wrap within the available space
    fontSize: width * 0.046, // Consistent with paragraph font size
    lineHeight: width * 0.075, // Consistent with paragraph line height
    color: "#444", // Slightly darker grey for clarity

    fontWeight: "400",
  },
  nestedBulletContainer: {
    marginLeft: width * 0.04, // Indent for nested lists
    marginTop: height * 0.01,
  },
  nestedBulletIcon: {
    fontSize: width * 0.045, // Smaller icon for nested bullets
    color: "#666", // Less vibrant color for nested bullets
    marginRight: width * 0.015,
  },
});

export default Privacy;
