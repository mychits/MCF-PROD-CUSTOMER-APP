import React, { useContext, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  StatusBar,
  Alert,
  SafeAreaView,
  Dimensions,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native"; // Import useRoute
import Ionicons from "react-native-vector-icons/Ionicons";
import Header from "../components/layouts/Header";
import { ContextProvider } from "../context/UserProvider";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledBeforeCreate
) {
  UIManager.setLayoutAnimationEnabledBeforeCreate(true);
}

const { width, height } = Dimensions.get("window");

const Checkbox = ({
  isChecked,
  onPress,
  size = 24,
  color = "#0A4B9F",
  unCheckedColor = "#64748B",
}) => {
  return (
    <TouchableOpacity style={styles.checkboxContainer} onPress={onPress}>
      <Ionicons
        name={isChecked ? "checkbox-outline" : "square-outline"}
        size={size}
        color={isChecked ? color : unCheckedColor}
        style={styles.checkboxIcon} // Added style for icon spacing
      />
      <Text style={styles.agreementText}>
        {" "}
        {/* Using existing agreementText style or define a new one */}I have
        read and agree to the Terms & Conditions and Privacy Policy.
      </Text>
    </TouchableOpacity>
  );
};

const Section = ({ title, children }) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View style={styles.sectionContainer}>
      <TouchableOpacity
        onPress={toggleExpand}
        style={[styles.sectionHeader, expanded && styles.sectionHeaderExpanded]}
        activeOpacity={0.7}
      >
        <Text style={styles.sectionTitle}>{title}</Text>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={24}
          color={expanded ? "#0A4B9F" : "#64748B"}
        />
      </TouchableOpacity>
      {expanded && <View style={styles.sectionContent}>{children}</View>}
    </View>
  );
};

const Termsconditions = () => {
  const navigation = useNavigation();
  const route = useRoute(); // Use useRoute to access parameters
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const { groupId } = route.params || {};
  const [appUser, setAppUser] = useContext(ContextProvider);
  const userId = appUser.userId || {};

  const mockUserId = userId || "12345"; // Use actual userId if available, fallback to mock

  const handleProceed = () => {
    if (agreedToTerms) {
      navigation.navigate("EnrollForm", {
        termsReadConfirmed: true,
        groupId,
        userId,
      });
    } else {
      Alert.alert(
        "Required",
        "Please accept the Terms & Conditions and Privacy Policy to proceed."
      );
    }
  };

  const termsFullContent = `By Clicking On The "I Accept" BUTTON, YOU ACKNOWLEDGE THAT YOU HAVE READ AND UNDERSTOOD THESE CUSTOMER TERMS ("CUSTOMER TERMS").

PLEASE ENSURE THAT YOU READ AND UNDERSTAND ALL OF THESE CUSTOMER TERMS BEFORE YOU START USING THE WEBSITE, AS YOU WILL BE BOUND BY THESE CUSTOMER TERMS WHEN YOU CLICK "ACCEPT AND REGISTER".

IF YOU DO NOT AGREE WITH ANY OF THESE CUSTOMER TERMS, YOU MUST IMMEDIATELY CEASE ACCESSING AND USING THE WEBSITE AND THE SERVICES BEING PROVIDED UNDER THESE CUSTOMER TERMS. YOUR ACCEPTANCE OF THESE CUSTOMER TERMS WILL OPERATE AS A BINDING AGREEMENT BETWEEN YOU AND VIJAYA VINAYAK CHITFUNDS PRIVATE LIMITED ("referred to AS MYCHITS") IN RESPECT OF YOUR USE OF THE WEBSITE/APPLICATION, AND/OR SUBSCRIPTION OF AVAILABLE SERVICES.

USAGE OF THE TERM WEBSITE IN THESE TERMS SHALL DEEM TO INCLUDE ANY/ALL APPLICATIONS ("APPS") OWNED AND CONTROLLED BY VIJAYA VINAYAK CHITFUNDS PRIVATE LIMITED.

These Customer Terms are between You, AND VIJAYA VINAYAK CHITFUNDS PRIVATE LIMITED ("hereinafter" referred to as "Company", "MYCHITS", "we", "us"), each referred to individually as "Party" and collectively the "Parties".

Background
Company owns and operates the website and/or any Application and/or platform in the name and style of "MYCHITS" (https://mychits.co.in/) connected to or mentioned on this site and the Services provided under this website. The Website contains a subscription functionality which enables users to subscribe to the services offered. The site provides Services.

These Customer Terms apply to Your access to, and use of, the website and/or its Application (whether through a computer, mobile phone or other electronic device), the Subscription Services, other services and all information, recommendations and other products and services provided to You on or through the Website.
The parties agree as follows

1. Definitions
a. Unless the context requires otherwise, capitalized terms in these Customer Terms have the following meaning:
i. "Service" Shall mean the service provided by MYCHITS and Service Providers to users, whereby a User can (i) receive payments from their customers or other Payers; or (ii) manage their chit fund related operation from initiation of chit groups to closure related activities; or (iii) make payment to suppliers, beneficiaries or other payees, by (A) IMPS/NEFT/RTGS/UPI; Or (B) Credit/ Debit Card; Or (C) Net Banking; or (d) any other mode of payment through banks, that may be accepted by MYCHITS from time to time in these terms.
ii. "Use" Shall mean any registered Chit Fund company/Subscribers/entity in a chit group, who is boarded on the MYCHITS Platform for using this website and/or App, who transacts or avails of the services through this website and/or App, to make or to receive payments to or from third parties. The term "User" shall also cover such personnel of any User who are authorized to avail of the services on behalf of the User.
iii. "Payee" Shall mean any person to whom a payment is made, using the services, (and the term includes a User who uses the services to receive payment).
iv. "Payer" Shall means any person who makes a payment, using the services (and the term includes a User who uses the services to make payment).
v. "Products" Shall mean any services or Products which are purchased/ offered for sale by a User to third parties from time to time, using these services.
vi. "Service Provider" Shall mean a Bank, Payments Infrastructure/Gateway providers, Association, Facility provider, Card issuing institution, Acquiring Bank, Other Financial Institution, Card Processor, Insurance Companies, Non-Banking Financial Services Companies, Clearing House Networks whose facilities or services are utilized in the provision of these services.
vii. "Transaction" Shall mean a payment instruction that results in the successful transfer of monies (a) From a User to a Payee; or (b) From a Payer to a User; or (c) From a Service Provider to a User; or (d) From a Service Provider to a Payer.
viii. "Transaction amount" Shall mean the total amount Payable/ Receivable by a User/Payee/Service Provider. This amount shall include all taxes, charges, interest, delivery costs, commissions, etc.
ix. "Charge Back" Shall mean, approved and settled credit card or net banking purchase transaction(s) which are at any time refused, debited or charged back to merchant account (and shall also include similar debits to Payment Service Provider's accounts, if any) by the acquiring bank or credit card company for any reason whatsoever, together with the bank fees, penalties and other charges incidental thereto.
x. "Subscription Services" shall mean such services provided and available for subscription by the Company and being performed by the Company or its 3rd Party affiliates on the Site and/or Application and more fully described under Clauses 3.1 to 3.4 of these Customer Terms and shall include Services as defined hereinunder.
xi. "You/Your" means you, the user and Subscriber of the Website and the Services.

2. Registration and Usage
In order to use the Services, the Subscription Services and the Website, You must:
a. be competent to enter into a contract under Applicable Laws, and You must provide the Company with accurate, complete, current, valid and true Registration Data ("Eligibility Requirements");
b. only open one Account using Your Registration Data, and not use the account of any other person;
c. only use the Application solely in accordance with these Customer Terms and all Applicable Laws, and not use the Application, Subscription Services or Services for any illegal or unlawful purposes;
d. only use the Application, Subscription Services and Services for Your sole, personal use, and not transfer, sell, sub-license or assign it to a third party;
e. not do or try to do anything to interfere with or harm the Website, the Subscription Services, the Services or the network of the Company or any of its Affiliates in any way whatsoever;
f. provide such information and documents which the Company may reasonably request from time to time, and promptly notify the Company of any change to any of Your Registration Data or other information provided to the Company;
g. only use an authorised telephonic or internet network to access and use the Website. When using the Website, the Subscription Services and the Services, standard messaging charges, data charges and/or voice charges (as applicable) may be imposed by Your Device provider and the same are Your responsibility.
h. You are solely responsible for maintaining the confidentiality of Your Registration Data and Application login credentials, and will be liable for all activities and transactions, and any other misuse of the Application, that occurs through Your Account (whether initiated by You or any third party), except to the extent caused or contributed by Company.
i. You must also notify the Company immediately if You cannot access Your Account, You know of or suspect any unauthorised access or use of Your Registration Data, login details or Account, or the security of Your Account has been compromised in any way.
j. The Company and/or any of its Third-Party Service Providers may suspend access and Service subscriptions entered into if:
i. the Registration Data or any other information provided by You is false, or You cease to satisfy the Eligibility Requirements;
ii. the security of Your Account has been compromised in any way; or
iii. You have not complied with any of the requirements in this clause.
k. The Company and/or any of its Third-Party Service Providers may block, suspend, alter or update the Website, the Subscription Services and/or the Services at any time (including without notice):
i. to make improvements to the Website, the Subscription Services and/or the Services (including the security of the Website, the Subscription Services and/or the Services);
ii. as required by Applicable Law; or
iii. to protect a legitimate business interest.
l. However, You may terminate these Customer Terms in accordance with Clause 14 at any time.

3. Subscription Services
a. The Website allows the Subscriber to select their desired service requirement from the list of services and Packages offered by the Company as per Schedule A.
b. Once You request for a service and the same has been accepted, Company will provide:
i. You with a confirmation through the Website, along with information regarding the Services and any other details the Company considers appropriate;
ii. On receiving the necessary details from the Service Provider, initiate the required payment to Payee/User/ as instructed by User/ Payer.
iii. Confirmation of the Transaction performed using valid login credentials and this shall be conclusive evidence of a Transaction being aff However, User is responsible to furnish Company with correct and current Payee information.
iv. In the event that the payment is in respect of a purchase of Products / service by the User/Payee, Company shall not be required to ensure that the purchased Products / service have been duly delivered. In the event a User chooses to complain about a Transaction, the same should be communicated to Company within 10 (ten) days of the Transaction.
c. Along with the above services provided by the Company, Company shall do the following:
i. Keeping records of the Subscription Services availed;
ii. Remotely monitor any Service transactions using the Website; and
iii. Providing customer support for grievance redressal;
d. Except as expressly stated in these Customer Terms, the obligations of the Company are limited to (a) licensing the Website services to You; (b) managing and operating the Website and Services in the manner reasonably determined by the Company; (c) operating the platform in order to facilitate the provision of Services to You (and other customers); and (d) payment collection in respect of the Services provided to You (and other customers);

4. Subscription Confirmation
a. Where Your request for a Subscription, as provided in Schedule A has been accepted, You must check and confirm the details on the Subscription confirmation the website provides You. If there are any incorrect details on the Subscription confirmation, you must contact the Website immediately through your Account.
b. You are responsible for any delay that may be caused due to Your failure to check the Subscription confirmation or contact website immediately to correct the booking details.

5. Fees and Payment
a. In consideration of the services rendered by MYCHITS to the User, the User shall pay to MYCHITS a fee that is agreed upon in the fee schedule defined in the merchant agreement or MYCHITS website/app or proposed by MYCHITS over email to the registered email address.
b. MYCHITS shall deduct its Transaction fees plus service tax per successful Transaction, and make payment of the balance of the Transaction amount to User/ Payee's designated bank account. All other taxes, duties or charges shall be borne and paid by User, unless otherwise agreed between the parties. MYCHITS reserves the right to alter / modify / change the discount / commission rate at its discretion. MYCHITS also reserves the right to forthwith revise the Transaction fee payable in the event of any revision in the rates charges by the acquiring banks or card associations or guidelines issued by the RBI from time to time.
c. It is hereby agreed and acknowledged by the parties that the Transaction fees charged by MYCHITS in respect of a Transaction that has been confirmed shall not be returned or repaid by MYCHITS to the User or any other person irrespective of the Transaction being rejected, charged back, refunded or disputed.
d. Payment of the Services will be facilitated by a payment gateway and/or payment processing services provider appointed by the Company (the "Payment Processor"). The Payment Processor may be the Company, one of its related bodies corporates or an unrelated third party.
e. You will be required to provide relevant payment details including credit/debit card details ("Card Details") with the Payment Processor in order for the Company to process payment of the Services availed, and You hereby authorize the Payment Processor to do so.
f. Your authorization:
i. permits the Payment Processor to debit or credit the bank account or debit/credit card account associated with Your payment details;
ii. permits the Payment Processor to use Your Card Details for the processing of transactions initiated by You;
iii. will remain in effect as long as You maintain an Account (and if You delete Your Card Details or Account, Company and the Payment Processor will not be able to process any further transactions initiated by You); and
iv. is subject to any other terms and conditions of the Payment Processor specified through the Application or Services from time to time.
g. If any amount paid by You is fully or partially refundable for any reason such amounts will be credited to Your Account within 15 business days.
h. Any payment processing-related issue not caused by an error or fault with the Website must be resolved by You and the relevant Payment Processor.

6. Feedback, issues and complaints
a. All feedbacks issues and complaints are to be sent to the Company via the following email: admin@mychits.co.in

7. Your Obligations
a. You must provide true, current and complete information in your dealings with us (including when setting up an account), and must promptly update that information as required so that the information remains true, current and complete.
b. If you are given a User ID, you must keep your User ID secure and:
c. Not permit any other person to use your User ID, including not disclosing or providing it to any other person; and
d. Immediately notify us if you become aware of any disclosure or unauthorised use of your User ID, login details or Account, or the security of Your Account has been compromised in any way.
e. Not act in a way, or use or introduce anything (including any virus, worm, Trojan horse, timebomb, keystroke logger, spyware or other similar feature) that in any way compromises, or may compromise, the Website or any Underlying System, or otherwise attempt to damage or interfere with the Website or any Underlying System; and
f. Access the Website via standard web browsers only and not by any other method. Other methods include but are not limited to scraping, deep-linking, harvesting, data mining, use of a robot or spider, automation, or any similar data gathering, extraction or monitoring method.
g. You must obtain our written permission to establish a link to our Website. If you wish to do so, email your request to admin@mychits.co.in.
h. You indemnify us against all Losses we might suffer or incur as a direct or indirect result of your failure to comply with these Terms, including any failure of a person who accesses and uses our Website by using your User ID.

8. Intellectual Property Rights
a. The Website and all associated intellectual property rights ("IP") remain the property of the Company or its third-party licensors. Except as expressly stated, nothing in these Customer Terms grants the Customer any rights in or related to the IP, and all rights not expressly granted to the Customer are reserved by the Company.
b. The Customer must not:
i. copy, reproduce, modify, create derivative works of, decompile, reverse engineer, or attempt to derive the composition or underlying information, structure or ideas of, any IP;
ii. breach, disable, tamper with, or develop or use (or attempt) any workaround for any security measure provided on the website and/or Application;
iii. use any IP in a way that infringes or misappropriates a third party’s intellectual property rights or moral rights;
iv. distribute, disclose or allow use of any IP by any third party in any format, through any timesharing service, service bureau, network or by any other means;
v. merge or combine any IP with any other technology not provided by the Company or any; or
vi. remove any proprietary notice language on any copies of any IP.
c. Subject to compliance with these Customer Terms, the Company grants the Customer a limited, non-exclusive, personal, non-transferable licence during the term of these Customer Terms to use and access the Website on any Device that the Customer owns or controls and to run the Website solely for the Customers own personal use (including for the processing of payments).
d. The Customer is solely responsible for the Customer Intellectual Property materials or information stored and/or posted or transmitted through the Website and/or Application. ("Customer Intellectual Property").
e. Customer must ensure that the Customer Intellectual property is not unlawful and does not infringe any third party’s rights (including intellectual property rights), and Customer must not:
i. publish, post, upload, distribute or disseminate any inappropriate, profane, defamatory, infringing, obscene, indecent or unlawful, blasphemous, pornographic, libellous, invasive of another's privacy, hateful, or racially, ethnically objectionable, disparaging, or otherwise unlawful material or information, or any material relating to or encouraging money laundering or any other crime of any sort;
ii. upload files that contain software or other material protected by intellectual property laws (or by rights of privacy or publicity) unless You own or control the rights thereto or have received all necessary consents;
iii. upload files that contain viruses, corrupt files, or any other similar software or programs that may damage the operation of another computer or electronic device;
iv. download any file posted by another user that You know, or reasonably should know, cannot be legally distributed or used in any such manner by you;
v. falsify or delete any author attributions, legal or other proper notices or proprietary designations or labels of the origin or source of software or other material contained in a file that is uploaded;
vi. deceive or mislead the addressee about the origin of a message or communicate any information which is grossly offensive or menacing in nature;
vii. harvest or otherwise collect information about others, including e-mail addresses, without their consent.
f. Except for the Registration Data or any other data submitted by You during the use of the Service ("Permitted Information"), You should not, send any confidential or proprietary information to the Company, unless required by Applicable Laws. Except for the Permitted Information, and subject to Company handling Your personal information in accordance with the Privacy Policy.

9. Disclaimers
a. To the extent permitted by law, we and our licensors have no liability or responsibility to you or any other person for any Loss in connection with:
i. the Website being unavailable (in whole or in part) or performing slowly;
ii. any error in, or omission from, any information made available through the Website;
iii. any exposure to viruses or other forms of interference which may damage your computer system or expose you to fraud when you access or use the Website. To avoid doubt, you are responsible for ensuring the process by which you access and use the Website protects you from this; and
iv. any site linked from the Website. Any link on the Website to other sites does not imply any endorsement, approval or recommendation of, or responsibility for, those sites or their contents, operations, products or operators.
b. We make no representation or warranty that the Website is appropriate or available for use in all countries or that the content satisfies the laws of all countries. You are responsible for ensuring that your access to and use of the Website is not illegal or prohibited, and for your own compliance with applicable local laws.

10. Liability
a. To the maximum extent permitted by law:
i. you access and use the Website at your own risk; and
ii. we are not liable or responsible to you or any other person for any Loss under or in connection with these Terms, the Website, or your access and use of (or inability to access or use) the Website. This exclusion applies regardless of whether our liability or responsibility arises in contract, tort (including negligence), equity, breach of statutory duty, or otherwise.

11. Indemnification
a. You hereby indemnify to the fullest extent the Company from and against any and all liabilities, costs, demands, causes of action, damages and expenses (including reasonable attorney’s fees) arising out of or in any way related to your breach of any of the provisions of these Terms

13. Force Majeure
a. Any delay in or failure to perform any obligations by a Party under these Customer Terms will not constitute a breach of these Customer Terms to the extent caused by acts of any government authorities, including but not limited to a declaration of lockdown and/or curfew, acts of God, pandemics or any other kind of epidemic fire, flood, explosion, riots, war, rebellion, insurrection or other event beyond the reasonable control of that Party ("Force Majeure").

14. Termination
a. These Customer Terms continues until such time as they are terminated in accordance with this Clause 14.1.
b. You may terminate these Customer Terms at any time by closing Your Account or leaving the Website. You can close Your Account at any time by following the instructions on the Website.
c. The Company may terminate these Customer Terms with immediate effect upon notice to You if:
i. It needs to do so in order to comply with any Applicable Law;
ii. You cease to satisfy the Eligibility Requirements; or
iii. You commit a breach (other than a trivial or inconsequential breach) of these Customer Terms that is not capable of remedy or (if capable of remedy) is not remedied within 4 Business Days after Company notifies You of the breach.
d. Upon termination of these Customer Terms for any reason:
i. Your rights to use the Website will cease immediately, Your registration and Your Account will cease to apply, and the Company may block Your access to the Website;
ii. The Company will charge You all amounts due and owing at the date of termination; and
iii. the Parties must cease acting in a manner that would imply a continuing relationship between the Parties.
e. This clause will survive termination of these Customer Terms together with any other terms which by their nature do so.
f. Termination of these Customer Terms will not prejudice any rights of the Parties that may have accrued prior to such termin

15. Refund Policy
a. In the event there is any claim for/ of charge back by the User for any reason whatsoever, such User shall immediately approach MYCHITS with his/ her claim details and claim refund from MYCHITS Such refund (if any) shall be affected only by MYCHITS via payment gateway or such other means, as MYCHITS deems appropriate. No claims for refund/ charge back shall be made by any User to the Payment Service Provider(s) and in the event such claim is made it shall not be entertained.
b. Refund for fraudulent/duplicate transaction(s): The User shall directly contact MYCHITS for any fraudulent transaction(s) because of misuse of Card/ Bank details by a fraudulent individual/party and such issues shall be suitably addressed by MYCHITS alone in line with their policies and rules.

16. Notice
a. Any notices, requests and other communications required or permitted under these Customer Terms must be in writing and sent to the recipient Party as follows (as amended to time by the recipient Party by notice to the other Party):
i. The Company at:
VIJAYA VINAYAK CHITFUNDS PRIVATE LIMITED
No 11/36-25 2nd Main Kathriguppe Main Road Bangalore Karnataka India 560085
Or
Write to us at: admin@mychits.co.in
ii. To You by:
email or text message (SMS) to the email address or mobile number (as applicable) specified in the Account.

17. Entire Agreement
a. These Customer Terms constitute the entire agreement between the Parties in connection with, and will supersede all previous communications (either oral or written) between the Parties with respect to the subject matter of these Customer Terms, and no agreement or understanding varying or extending the same will be binding on either Party unless arising out of the specific provisions of these Customer Terms.
b. No party has entered into these Customer Terms in reliance on any term or statement other than the terms expressly set out herein, provided that this Clause 17.2 shall not apply to any fraudulent misrepresentation.

18. Relationship of the Parties
a. Nothing in these Customer Terms is intended to constitute a fiduciary relationship or an agency, partnership or trust, and You have no authority to bind the Company, nor does the Company have any authority to bind You.

19. Governing law and dispute resolution
a. These Customer Terms shall be governed by the laws of the Republic of India
b. In the event of a dispute arising out of this Agreement, the parties agree to attempt to resolve any dispute by negotiation between the parties. If they are unable to resolve the dispute, either party may commence mediation and/or binding arbitration and submit to the Arbitration proceeding as per the Arbitration and Conciliation Act, 1996. The prevailing party in any dispute resolved by binding arbitration or litigation shall be entitled to recover its attorneys’ fees and costs. Courts at Bangalore shall have exclusive jurisdiction with respect to the arbitration proceedings.
c. These Terms will be governed by and construed in accordance with the laws of the Republic of India and you submit to the exclusive jurisdiction of the courts located in Bangalore for the resolution of any disputes.

20. Referral / Promo Code
a. General Guidelines
i. Referral / Promo Code Application:
i. Referral / Promo codes can only be applied at the time of subscription or purchase during the payment process.
ii. Each referral / promo code is campaign-specific and must match the eligibility criteria (e.g., first-time subscription, upselling).
ii. Validity Period:
i. Referral / Promo codes are valid only within the specified start and end dates.
ii. Expired referral / promo codes cannot be used or reinstated.
iii. Discount Details:
i. Discounts vary based on the campaign type (e.g., first-time subscription, upselling offers).
ii. The discount value and type (percentage or flat) will be displayed during the payment process.
iv. Eligibility:
i. Referral / Promo codes for first-time subscriptions are valid for new users who have not previously made a purchase.
ii. Upselling referral / promo codes are valid for returning users making subsequent purchases.
b. Specific Campaign Guidelines
i. First-Time Subscription Referral / Promo Codes:
i. These referral / promo codes are valid for first-time customers only.
ii. Only one referral / promo code can be applied per first-time subscription.
ii. Upselling Referral / Promo Codes:
i. Separate referral / promo codes may be issued for upselling campaigns.
ii. Users are eligible for upselling referral / promo codes if they are purchasing additional plans or products after the initial subscription.
iii. Agent Mapping:
i. Referral / Promo codes are linked to agents for tracking purposes.
ii. In cases of upselling, a new referral / promo code can overwrite the previous agent mapping.
c. Usage Rules
i. Referral / Promo codes cannot be combined with other offers unless explicitly mentioned.
ii. A referral / Promo code can be used only once per eligible transaction.
iii. Referral / Promo codes are non-transferable and cannot be redeemed for cash.
iv. Users must enter the referral / promo code correctly during the payment process to avail of the offer. Retroactive application of referral / promo codes is not permitted.
d. Misuse and Fraud Prevention
i. The company reserves the right to:
i. Validate referral / promo code usage for authenticity.
ii. Cancel or revoke referral / promo codes if misuse or fraudulent activity is detected.
ii. Misuse includes, but is not limited to:
i. Sharing referral / promo codes beyond their intended audience.
ii. Attempting to use a referral / promo code multiple times where not permitted.
e. Additional Information
i. Amendments:
i. The company reserves the right to modify or withdraw referral / promo codes and offers at any time without prior notice.
ii. Updated terms will be published on the website and app help section.
ii. Customer Support:
i. For queries regarding referral / promo codes or offers, contact our support team via the following email: admin@mychits.co.in.
iii. Disclaimer:
i. The company is not liable for failed transactions due to user error (e.g., incorrect referral / promo code entry) or technical issues beyond our control.

21. Amendments to these customer terms
a. The Company may amend the terms of these Customer Terms and shall keep you updated regarding such amendments.
b. You will be required to confirm Your acceptance of the amendments referred to in Clause 20.1. However, if You do not agree to any such amendments, You may terminate these Customer Terms in accordance with Clause 14.2 at any time prior to such amendments coming into effect.
c. We may change these Terms at any time by updating them on the Website. Unless stated otherwise, any change takes effect immediately. You are responsible for ensuring you are familiar with the latest Terms. By continuing to access and use the Website, you agree to be bound by the changed Terms.
d. We may change, suspend, discontinue, or restrict access to, the Website without notice or liability
e. These Terms were last updated on 10/06/2025.

22. Miscellaneous
a. JointVentures: The Company will be entitled to enter into any transaction whereby it acquires, merges with or enters into a joint venture with any other institution engaged in the business of providing services similar to those referred to in these Customer Terms. In such case, You may be provided the Companies services by the company or the other institution respectively jointly and/or severally with the parties to any such arrangement. These Customer Terms will continue to apply in the event of any such arrangement. You may terminate these Customer Terms in accordance with Clause 14.2 at any time.
b. Waiver: Either Party may exercise a right, power or remedy at its discretion and separately or concurrently with another right, power or remedy. No failure or delay on the part of either Party exercising any right, power or privilege under these Customer Terms will operate as a waiver thereof, nor will any single or partial exercise of any right, power or privilege under these Customer Terms preclude any other or further exercise thereof or the exercise of any other rights, powers or privileges by such Party.
c. Assignment: Company shall be permitted to assign, transfer, and subcontract its rights and/or obligations under these Terms without any notification or consent required. However, you shall not be permitted to assign, transfer, or subcontract any of your rights and/or obligations under these Terms.
d. Severability: Any provision that is prohibited or unenforceable in any jurisdiction will, as to such jurisdiction, be ineffective to the extent of such prohibition or unenforceability without invalidating the remaining provisions or affecting the validity or enforceability of such provision in any other jurisdiction.
e. No warranties: This Website is provided "as is," with all faults, and VIJAYA VINAYAK CHITFUNDS PRIVATE LIMITED makes no express or implied representations or warranties, of any kind related to this Website or the materials contained on this Website. Additionally, nothing contained on this Website shall be construed as providing consult or advice to you.
f. Rights cumulative: Subject to any express provision in these Customer Terms to the contrary, the rights, powers or remedies of a Party under these Customer Terms are cumulative and in addition to, and do not exclude or limit, any right, power or remedy in any other part of these Customer Terms or otherwise provided at law or in equity.
g. Consent for underwriting: I hereby give my free consent and authorize VIJAYA VINAYAK CHITFUNDS PRIVATE LIMITED (MYCHITS) and its service provider by providing my personal information to obtain my Credit Information Report and Credit Score from Equifax Credit Information Services Pvt. Ltd. for the purpose of risk assessment and credit underwriting and not for any other purposes.
`;

  const privacyFullContent = `12. Privacy Policy

a. You are not required to provide personal information to us, although in some cases if you choose not to do so then we will be unable to make certain sections of the Website available to you. For example, we may need to have your contact information in order to provide you with updates from our Website.
b. The Company collects, stores, processes and transfers personal information (including sensitive financial information) in compliance with the Privacy Policy and any applicable statutes and regulations relating to the protection of personal data.
c. When you provide personal information to us, we will comply with the Privacy Policy https://www.MYCHITS.com/privacy-policy.html of this website.
d. Company shall have the right to reach out to telephone/mobile numbers and/or e-mail ID's provided by you on the website for providing promotional or other information. You may choose to unsubscribe to this by writing to us at admin@mychits.co.in.
e. You have the right to request access to and correction of any of the personal information we hold about you. If you would like to exercise these rights, please email us at: admin@mychits.co.in
`;

  return (
    <View style={styles.mainContainer}>
      <View style={styles.headerWrapper}>
        <Header userId={mockUserId} navigation={navigation} />
      </View>

      <ScrollView
        style={styles.scrollViewContent}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.mainHeading}>
          Terms & Conditions and Privacy Policy for My Chit
        </Text>

        <Section title="Terms and Conditions">
          <Text style={styles.paragraph}>{termsFullContent}</Text>
        </Section>

        <Section title="Privacy Policy">
          <Text style={styles.paragraph}>{privacyFullContent}</Text>
        </Section>

        <View style={styles.whyReadSection}>
          <Text style={styles.whyReadHeading}>
            Why Customers Must Read Them All:
          </Text>
          <Text style={styles.paragraph}>
            Reading and understanding these documents is crucial for several
            reasons:
          </Text>
          <Text style={styles.listItem}>
            <Ionicons
              name="checkmark-circle-outline"
              size={18}
              color="#10B981"
              style={styles.listIcon}
            />
            <Text style={styles.boldText}>Legal Binding Agreement:</Text> The
            terms and conditions form a legally binding contract between you and
            the chit fund company.
          </Text>
          <Text style={styles.listItem}>
            <Ionicons
              name="alert-circle-outline"
              size={18}
              color="#FFC107"
              style={styles.listIcon}
            />
            <Text style={styles.boldText}>Obligations and Rights:</Text> They
            clearly define your obligations (e.g., timely payments, security for
            prized subscribers) and your rights (e.g., receiving receipts,
            attending auctions).
          </Text>
          <Text style={styles.listItem}>
            <Ionicons
              name="warning-outline"
              size={18}
              color="#EF4444"
              style={styles.listIcon}
            />
            <Text style={styles.boldText}>Penalties and Consequences:</Text>{" "}
            You'll be aware of the penalties for default, which can be
            significant, especially for prized subscribers.
          </Text>
          <Text style={styles.listItem}>
            <Ionicons
              name="wallet-outline"
              size={18}
              color="#0A4B9F"
              style={styles.listIcon}
            />
            <Text style={styles.boldText}>Financial Implications:</Text>{" "}
            Understanding how dividends are calculated, how prize money is
            disbursed, and the security requirements.
          </Text>
          <Text style={styles.listItem}>
            <Ionicons
              name="document-lock-outline"
              size={18}
              color="#4CAF50"
              style={styles.listIcon}
            />
            <Text style={styles.boldText}>Data Privacy:</Text> Knowing what
            personal and financial information is collected, how it's used, with
            whom it might be shared, and how it's protected.
          </Text>
          <Text style={styles.listItem}>
            <Ionicons
              name="hand-right-outline"
              size={18}
              color="#FF5722"
              style={styles.listIcon}
            />
            <Text style={styles.boldText}>Dispute Resolution:</Text> Familiarity
            with the process for resolving any disputes that may arise.
          </Text>
          <Text style={styles.paragraph}>
            In essence, these documents are designed to protect both the chit
            fund company and the subscribers by establishing clear guidelines
            and expectations. By reading them, customers can make informed
            decisions, avoid misunderstandings, and ensure a smooth
            participation in the chit fund.
          </Text>
        </View>

        <View style={styles.agreementSection}>
          <Checkbox
            isChecked={agreedToTerms}
            onPress={() => setAgreedToTerms(!agreedToTerms)}
          />
          {/* The text for the checkbox is now inside the Checkbox component */}
        </View>

        <TouchableOpacity
          style={[
            styles.proceedButton,
            !agreedToTerms && styles.proceedButtonDisabled,
          ]}
          onPress={handleProceed}
          disabled={!agreedToTerms}
        >
          <Text style={styles.proceedButtonText}>Proceed</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#F2F2F2",
  },
  headerWrapper: {
    backgroundColor: "#053B90",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  scrollViewContent: {
    flex: 1,
    backgroundColor: "#F2F2F2",
  },
  contentContainer: {
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  mainHeading: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#053B90",
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 32,
  },
  sectionContainer: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    marginBottom: 15,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 6,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: "#E3F2FD",
    borderBottomWidth: 1,
    borderBottomColor: "#BBDEFB",
  },
  sectionHeaderExpanded: {
    borderBottomColor: "transparent",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#053B90",
    flex: 1,
    marginRight: 10,
  },
  sectionContent: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
    color: "#333",
    marginBottom: 10,
    fontFamily: "System",
  },
  italicText: {
    fontStyle: "italic",
    fontWeight: "600",
  },
  boldText: {
    fontWeight: "bold",
  },
  subSubHeading: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#053B90",
    marginTop: 15,
    marginBottom: 8,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    paddingLeft: 5,
  },
  listIcon: {
    marginRight: 25, // Increased from 10 to 15 for more space
    marginTop: 2, // Align icon with text
  },
  whyReadSection: {
    backgroundColor: "#E8F5E9", // Light green background
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 6,
    borderLeftWidth: 5,
    borderLeftColor: "#4CAF50", // Green border on the left
  },
  whyReadHeading: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2E7D32", // Dark green text
    marginBottom: 15,
    textAlign: "center",
  },
  agreementSection: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
    paddingHorizontal: 15,
  },
  agreementText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 10, // Original was 10, adjusting for icon spacing
    flexShrink: 1, // Allows text to wrap
  },
  linkText: {
    color: "#053B90",
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  proceedButton: {
    backgroundColor: "#053B90",
    paddingVertical: 15,
    borderRadius: 10,
    marginHorizontal: 15,
    marginBottom: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#053B90",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  proceedButtonDisabled: {
    backgroundColor: "#A0A0A0", // Grey out button when disabled
    shadowColor: "#A0A0A0",
    opacity: 0.7,
  },
  proceedButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  checkboxContainer: {
    flexDirection: "row", // Ensure content is in a row
    alignItems: "center", // Align items vertically
    padding: 5,
  },
  checkboxIcon: {
    // New style for the icon specifically
    marginRight: 8, // Add space to the right of the icon
  },
});

export default Termsconditions;
