/* NOW ENJOY - translation layer (Hindi = hi, Assamese = as).
   common.js loads this file only when a language other than English is in use.
   It translates the text already on the page and anything the page adds later.
   The site name "NOW ENJOY" is never translated, and nothing is stored anywhere. */
(() => {
  'use strict';
  if (window.NowEnjoyI18n) return;

  // [English, Hindi, Assamese]  (upper / lower case of the English text does not matter)
  const RAW = [
    // ---- shared: header, footer, page titles ----
    [`Upload`, `अपलोड`, `আপলোড`],
    [`Profile`, `प्रोफ़ाइल`, `প্ৰফাইল`],
    [`Settings`, `सेटिंग्स`, `ছেটিংছ`],
    [`Home`, `होम`, `ঘৰ`],
    [`NOW ENJOY Home`, `NOW ENJOY होम`, `NOW ENJOY ঘৰ`],
    [`© NOW ENJOY : "This website is strictly for adults (18+) only"`, `© NOW ENJOY : "यह वेबसाइट केवल वयस्कों (18+) के लिए है"`, `© NOW ENJOY : "এই ৱেবছাইটখন কেৱল প্ৰাপ্তবয়স্কসকলৰ (18+) বাবে"`],
    [`Login / Sign Up`, `लॉगिन / साइन अप`, `লগইন / ছাইন আপ`],
    [`Video Player`, `वीडियो प्लेयर`, `ভিডিঅ' প্লেয়াৰ`],
    [`Playlist Details`, `प्लेलिस्ट का विवरण`, `প্লেলিষ্টৰ বিৱৰণ`],

    // ---- login / create account ----
    [`PLAY ◇ CONNECT ◇ ENJOY`, `खेलें ◇ जुड़ें ◇ आनंद लें`, `খেলক ◇ সংযোগ হওক ◇ আনন্দ কৰক`],
    [`Login`, `लॉगिन`, `লগইন`],
    [`Enter your credentials to access the realm`, `अंदर आने के लिए अपनी जानकारी दर्ज करें`, `ভিতৰলৈ আহিবলৈ আপোনাৰ তথ্য দিয়ক`],
    [`GMAIL ADDRESS *`, `जीमेल पता *`, `জিমেইল ঠিকনা *`],
    [`PASSWORD *`, `पासवर्ड *`, `পাছৱৰ্ড *`],
    [`Enter password`, `पासवर्ड डालें`, `পাছৱৰ্ড দিয়ক`],
    [`Don't have an account?`, `खाता नहीं है?`, `একাউণ্ট নাই নেকি?`],
    [`Create account`, `खाता बनाएँ`, `একাউণ্ট খোলক`],
    [`Join NOW ENJOY and start streaming!`, `NOW ENJOY से जुड़ें और स्ट्रीमिंग शुरू करें!`, `NOW ENJOY ৰ সৈতে যোগ দিয়ক আৰু ষ্ট্ৰিমিং আৰম্ভ কৰক!`],
    [`1. COMPLETE NAME *`, `1. पूरा नाम *`, `1. সম্পূৰ্ণ নাম *`],
    [`2. USERNAME *`, `2. यूज़रनेम *`, `2. ইউজাৰনেম *`],
    [`3. GMAIL ACCOUNT *`, `3. जीमेल अकाउंट *`, `3. জিমেইল একাউণ্ট *`],
    [`4. PASSWORD *`, `4. पासवर्ड *`, `4. পাছৱৰ্ড *`],
    [`5. REPEAT PASSWORD *`, `5. पासवर्ड दोबारा लिखें *`, `5. পাছৱৰ্ড পুনৰ লিখক *`],
    [`6. AGE (18+ ONLY) *`, `6. उम्र (केवल 18+) *`, `6. বয়স (কেৱল 18+) *`],
    [`At least 6 characters`, `कम से कम 6 अक्षर`, `কমেও 6টা আখৰ`],
    [`Confirm password`, `पासवर्ड की पुष्टि करें`, `পাছৱৰ্ড নিশ্চিত কৰক`],
    [`e.g. 21`, `जैसे 21`, `যেনে 21`],
    [`Already have an account?`, `पहले से खाता है?`, `আগতেই একাউণ্ট আছে নেকি?`],
    [`Continue without an account`, `बिना खाते के आगे बढ़ें`, `একাউণ্ট নোহোৱাকৈ আগবাঢ়ক`],
    [`Show or hide password`, `पासवर्ड दिखाएँ या छुपाएँ`, `পাছৱৰ্ড দেখুৱাওক বা লুকুৱাওক`],
    [`Invalid email or password credentials!`, `ईमेल या पासवर्ड गलत है!`, `ইমেইল বা পাছৱৰ্ড ভুল!`],
    [`Please confirm your Gmail first. Check your inbox (and spam folder) for the confirmation link.`, `पहले अपना जीमेल कन्फ़र्म करें। पुष्टि लिंक के लिए अपना इनबॉक्स (और स्पैम फ़ोल्डर) देखें।`, `প্ৰথমে আপোনাৰ জিমেইল নিশ্চিত কৰক। নিশ্চিতকৰণ লিংকৰ বাবে আপোনাৰ ইনবক্স (আৰু স্পেম ফোল্ডাৰ) চাওক।`],
    [`Too many attempts. Please wait a few minutes and try again.`, `बहुत ज़्यादा कोशिशें हो गईं। कृपया कुछ मिनट रुककर फिर कोशिश करें।`, `বহুত বেছি চেষ্টা কৰা হ'ল। অনুগ্ৰহ কৰি কিছু মিনিট অপেক্ষা কৰি পুনৰ চেষ্টা কৰক।`],
    [`Unable to log in. Please try again.`, `लॉगिन नहीं हो सका। कृपया फिर कोशिश करें।`, `লগইন কৰিব পৰা নগ'ল। অনুগ্ৰহ কৰি পুনৰ চেষ্টা কৰক।`],
    [`This Gmail is already registered. Please login.`, `यह जीमेल पहले से रजिस्टर है। कृपया लॉगिन करें।`, `এই জিমেইল আগতেই পঞ্জীয়ন কৰা হৈছে। অনুগ্ৰহ কৰি লগইন কৰক।`],
    [`Password is too weak. Please choose a stronger password.`, `पासवर्ड बहुत कमज़ोर है। कृपया मज़बूत पासवर्ड चुनें।`, `পাছৱৰ্ড বহুত দুৰ্বল। অনুগ্ৰহ কৰি এটা শক্তিশালী পাছৱৰ্ড বাছনি কৰক।`],
    [`Too many sign-up attempts or emails sent. Please wait a while and try again.`, `साइन-अप की बहुत कोशिशें या ईमेल भेजे जा चुके हैं। कृपया थोड़ी देर रुककर फिर कोशिश करें।`, `বহুত বেছি ছাইন-আপৰ চেষ্টা বা ইমেইল পঠোৱা হৈছে। অনুগ্ৰহ কৰি কিছু সময় অপেক্ষা কৰি পুনৰ চেষ্টা কৰক।`],
    [`Could not create the account. Please make sure your username is unique and that you are 18 or older.`, `खाता नहीं बन सका। कृपया देखें कि आपका यूज़रनेम अलग है और आपकी उम्र 18 या उससे अधिक है।`, `একাউণ্ট সৃষ্টি কৰিব পৰা নগ'ল। অনুগ্ৰহ কৰি নিশ্চিত কৰক যে আপোনাৰ ইউজাৰনেম অনন্য আৰু আপোনাৰ বয়স 18 বা তাতকৈ অধিক।`],
    [`Please enter a valid Gmail address.`, `कृपया सही जीमेल पता डालें।`, `অনুগ্ৰহ কৰি এটা সঠিক জিমেইল ঠিকনা দিয়ক।`],
    [`Unable to create account. Please try again.`, `खाता नहीं बन सका। कृपया फिर कोशिश करें।`, `একাউণ্ট সৃষ্টি কৰিব পৰা নগ'ল। অনুগ্ৰহ কৰি পুনৰ চেষ্টা কৰক।`],
    [`Login service is not available. Please refresh the page.`, `लॉगिन सेवा उपलब्ध नहीं है। कृपया पेज रिफ़्रेश करें।`, `লগইন সেৱা উপলব্ধ নহয়। অনুগ্ৰহ কৰি পৃষ্ঠাখন ৰিফ্ৰেচ কৰক।`],
    [`Please enter both Gmail and password.`, `कृपया जीमेल और पासवर्ड दोनों डालें।`, `অনুগ্ৰহ কৰি জিমেইল আৰু পাছৱৰ্ড দুয়োটা দিয়ক।`],
    [`Sign-up service is not available. Please refresh the page.`, `साइन-अप सेवा उपलब्ध नहीं है। कृपया पेज रिफ़्रेश करें।`, `ছাইন-আপ সেৱা উপলব্ধ নহয়। অনুগ্ৰহ কৰি পৃষ্ঠাখন ৰিফ্ৰেচ কৰক।`],
    [`All fields are required!`, `सभी जानकारी भरना ज़रूरी है!`, `সকলো তথ্য দিয়া আৱশ্যক!`],
    [`Name is too long (maximum 100 characters).`, `नाम बहुत लंबा है (अधिकतम 100 अक्षर)।`, `নামটো বহুত দীঘল (সৰ্বাধিক 100টা আখৰ)।`],
    [`Please enter a valid Gmail address ending in @gmail.com.`, `कृपया @gmail.com पर खत्म होने वाला सही जीमेल पता डालें।`, `অনুগ্ৰহ কৰি @gmail.com ত শেষ হোৱা এটা সঠিক জিমেইল ঠিকনা দিয়ক।`],
    [`Password must be at least 6 characters.`, `पासवर्ड कम से कम 6 अक्षर का होना चाहिए।`, `পাছৱৰ্ড কমেও 6টা আখৰৰ হ'ব লাগিব।`],
    [`Passwords do not match!`, `पासवर्ड मेल नहीं खाते!`, `পাছৱৰ্ড মিলা নাই!`],
    [`Please enter a valid age.`, `कृपया सही उम्र डालें।`, `অনুগ্ৰহ কৰি সঠিক বয়স দিয়ক।`],
    [`Sorry, you must be at least 18 years old to create an account.`, `क्षमा करें, खाता बनाने के लिए आपकी उम्र कम से कम 18 साल होनी चाहिए।`, `ক্ষমা কৰিব, একাউণ্ট খুলিবলৈ আপোনাৰ বয়স কমেও 18 বছৰ হ'ব লাগিব।`],
    [`Username must be 3–24 letters, numbers, or underscores.`, `यूज़रनेम 3–24 अक्षर, अंक या अंडरस्कोर का होना चाहिए।`, `ইউজাৰনেম 3–24টা আখৰ, সংখ্যা বা আণ্ডাৰস্ক'ৰৰ হ'ব লাগিব।`],
    [`Sign-up is not fully set up yet (database setup missing). Please contact the site owner.`, `साइन-अप अभी पूरी तरह तैयार नहीं है (डेटाबेस सेटअप बाकी है)। कृपया साइट मालिक से संपर्क करें।`, `ছাইন-আপ এতিয়াও সম্পূৰ্ণভাৱে সাজু হোৱা নাই (ডাটাবেছ ছেটআপ বাকী আছে)। অনুগ্ৰহ কৰি ছাইটৰ গৰাকীৰ সৈতে যোগাযোগ কৰক।`],
    [`Username is already taken!`, `यह यूज़रनेम पहले से लिया जा चुका है!`, `এই ইউজাৰনেম আগতেই লোৱা হৈছে!`],
    [`Login service could not be loaded. Please check your internet connection and refresh the page.`, `लॉगिन सेवा लोड नहीं हो सकी। कृपया अपना इंटरनेट जाँचें और पेज रिफ़्रेश करें।`, `লগইন সেৱা লোড কৰিব পৰা নগ'ল। অনুগ্ৰহ কৰি আপোনাৰ ইণ্টাৰনেট পৰীক্ষা কৰি পৃষ্ঠাখন ৰিফ্ৰেচ কৰক।`],
    [`Something went wrong while loading the page. Please refresh and try again.`, `पेज लोड करते समय कुछ गड़बड़ हो गई। कृपया रिफ़्रेश करके फिर कोशिश करें।`, `পৃষ্ঠাখন লোড কৰোঁতে কিবা ভুল হ'ল। অনুগ্ৰহ কৰি ৰিফ্ৰেচ কৰি পুনৰ চেষ্টা কৰক।`],

    // ---- age check ----
    [`AGE VERIFICATION`, `आयु सत्यापन`, `বয়স সত্যাপন`],
    [`Are you 18 years of age or older?`, `क्या आपकी उम्र 18 साल या उससे अधिक है?`, `আপোনাৰ বয়স 18 বছৰ বা তাতকৈ অধিক নে?`],
    [`This website is intended exclusively for adults aged 18 and above. Please confirm your age before continuing.`, `यह वेबसाइट केवल 18 साल और उससे अधिक उम्र के वयस्कों के लिए है। आगे बढ़ने से पहले कृपया अपनी उम्र की पुष्टि करें।`, `এই ৱেবছাইটখন কেৱল 18 বছৰ বা তাতকৈ অধিক বয়সৰ প্ৰাপ্তবয়স্কসকলৰ বাবে। আগবাঢ়ি যোৱাৰ আগতে অনুগ্ৰহ কৰি আপোনাৰ বয়স নিশ্চিত কৰক।`],
    [`YES, I AM 18+`, `हाँ, मैं 18+ हूँ`, `হয়, মই 18+`],
    [`NO, I AM UNDER 18`, `नहीं, मैं 18 से कम का हूँ`, `নহয়, মই 18 তকৈ কম`],
    [`By continuing, you confirm that you meet the minimum age requirement.`, `आगे बढ़कर आप पुष्टि करते हैं कि आप न्यूनतम आयु की शर्त पूरी करते हैं।`, `আগবাঢ়ি গ'লে আপুনি নিশ্চিত কৰে যে আপুনি নূন্যতম বয়সৰ চৰ্ত পূৰণ কৰে।`],
    [`ACCESS DENIED`, `प्रवेश वर्जित`, `প্ৰৱেশ নিষেধ`],
    [`Sorry, you must be at least 18 years old to access this website. You will now leave this page.`, `क्षमा करें, इस वेबसाइट को देखने के लिए आपकी उम्र कम से कम 18 साल होनी चाहिए। अब आप इस पेज से बाहर जाएँगे।`, `ক্ষমা কৰিব, এই ৱেবছাইটখন চাবলৈ আপোনাৰ বয়স কমেও 18 বছৰ হ'ব লাগিব। এতিয়া আপুনি এই পৃষ্ঠাখনৰ পৰা ওলাই যাব।`],

    // ---- home / playlists lists ----
    [`VIDEOS`, `वीडियो`, `ভিডিঅ'`],
    [`WARNING: You must be 18 or older to enter this site`, `चेतावनी: इस साइट में आने के लिए आपकी उम्र 18 या उससे अधिक होनी चाहिए`, `সতৰ্কবাণী: এই ছাইটত প্ৰৱেশ কৰিবলৈ আপোনাৰ বয়স 18 বা তাতকৈ অধিক হ'ব লাগিব`],
    [`Search videos...`, `वीडियो खोजें...`, `ভিডিঅ' সন্ধান কৰক...`],
    [`Search videos`, `वीडियो खोजें`, `ভিডিঅ' সন্ধান কৰক`],
    [`Video`, `वीडियो`, `ভিডিঅ'`],
    [`Playlist`, `प्लेलिस्ट`, `প্লেলিষ্ট`],
    [`Filter`, `फ़िल्टर`, `ফিল্টাৰ`],
    [`Real Life (Humans)`, `असली जीवन (इंसान)`, `বাস্তৱ জীৱন (মানুহ)`],
    [`Donghua`, `डोंगहुआ`, `ডংহুৱা`],
    [`Anime`, `एनिमे`, `এনিমে`],
    [`Cartoon`, `कार्टून`, `কাৰ্টুন`],
    [`Clear all`, `सब हटाएँ`, `সকলো আঁতৰাওক`],
    [`No videos uploaded`, `कोई वीडियो अपलोड नहीं हुआ`, `কোনো ভিডিঅ' আপলোড কৰা হোৱা নাই`],
    [`PLAYLISTS`, `प्लेलिस्ट`, `প্লেলিষ্ট`],
    [`Find your playlists`, `अपनी प्लेलिस्ट खोजें`, `আপোনাৰ প্লেলিষ্ট বিচাৰক`],
    [`Search playlists...`, `प्लेलिस्ट खोजें...`, `প্লেলিষ্ট সন্ধান কৰক...`],
    [`Search playlists`, `प्लेलिस्ट खोजें`, `প্লেলিষ্ট সন্ধান কৰক`],
    [`No playlists created yet.`, `अभी कोई प्लेलिस्ट नहीं बनी।`, `এতিয়ালৈকে কোনো প্লেলিষ্ট বনোৱা হোৱা নাই।`],
    [`No playlists match your search.`, `आपकी खोज से कोई प्लेलिस्ट मेल नहीं खाती।`, `আপোনাৰ সন্ধানৰ লগত কোনো প্লেলিষ্ট মিলা নাই।`],
    [`BACK TO PLAYLISTS`, `प्लेलिस्ट पर वापस जाएँ`, `প্লেলিষ্টলৈ উভতি যাওক`],
    [`PLAYLIST VIDEOS`, `प्लेलिस्ट के वीडियो`, `প্লেলিষ্টৰ ভিডিঅ'`],
    [`No videos assigned to this playlist yet.`, `इस प्लेलिस्ट में अभी कोई वीडियो नहीं है।`, `এই প্লেলিষ্টত এতিয়ালৈকে কোনো ভিডিঅ' নাই।`],
    [`Playlist not found.`, `प्लेलिस्ट नहीं मिली।`, `প্লেলিষ্ট পোৱা নগ'ল।`],

    // ---- video page ----
    [`BACK TO HOME`, `होम पर वापस जाएँ`, `ঘৰলৈ উভতি যাওক`],
    [`Your browser does not support video playback.`, `आपका ब्राउज़र वीडियो चलाने का समर्थन नहीं करता।`, `আপোনাৰ ব্ৰাউজাৰে ভিডিঅ' চলোৱা সমৰ্থন নকৰে।`],
    [`PLAYLIST`, `प्लेलिस्ट`, `প্লেলিষ্ট`],
    [`RELATED VIDEOS`, `संबंधित वीडियो`, `সম্পৰ্কিত ভিডিঅ'`],
    [`NOW PLAYING`, `अभी चल रहा है`, `এতিয়া চলি আছে`],
    [`Video not found`, `वीडियो नहीं मिला`, `ভিডিঅ' পোৱা নগ'ল`],
    [`Video not found.`, `वीडियो नहीं मिला।`, `ভিডিঅ' পোৱা নগ'ল।`],
    [`Like video`, `वीडियो को लाइक करें`, `ভিডিঅ' লাইক কৰক`],
    [`Dislike video`, `वीडियो को डिसलाइक करें`, `ভিডিঅ' ডিছলাইক কৰক`],
    [`Audio language`, `ऑडियो भाषा`, `অডিঅ' ভাষা`],
    [`Original`, `मूल`, `মূল`],
    [`Could not save your reaction. Please try again.`, `आपकी प्रतिक्रिया सहेजी नहीं जा सकी। कृपया फिर कोशिश करें।`, `আপোনাৰ প্ৰতিক্ৰিয়া সংৰক্ষণ কৰিব পৰা নগ'ল। অনুগ্ৰহ কৰি পুনৰ চেষ্টা কৰক।`],
    // player controls
    [`Play`, `चलाएँ`, `চলাওক`],
    [`Pause`, `रोकें`, `ৰখাওক`],
    [`Rewind 10s`, `10 सेकंड पीछे`, `10 ছেকেণ্ড পিছলৈ`],
    [`Forward 10s`, `10 सेकंड आगे`, `10 ছেকেণ্ড আগলৈ`],
    [`Mute`, `म्यूट करें`, `মিউট কৰক`],
    [`Unmute`, `अनम्यूट करें`, `আনমিউট কৰক`],
    [`Volume`, `आवाज़`, `ভলিউম`],
    [`Speed`, `गति`, `গতি`],
    [`Loop`, `लूप`, `লুপ`],
    [`Normal`, `सामान्य`, `সাধাৰণ`],
    [`Enter fullscreen`, `फ़ुलस्क्रीन करें`, `ফুলস্ক্ৰীন কৰক`],
    [`Exit fullscreen`, `फ़ुलस्क्रीन बंद करें`, `ফুলস্ক্ৰীন বন্ধ কৰক`],
    [`Go back to previous menu`, `पिछले मेन्यू पर जाएँ`, `আগৰ মেনুলৈ যাওক`],
    [`Current time`, `वर्तमान समय`, `বৰ্তমান সময়`],
    [`Duration`, `अवधि`, `সময়সীমা`],

    // ---- profile ----
    [`USER PROFILE`, `यूज़र प्रोफ़ाइल`, `ব্যৱহাৰকাৰীৰ প্ৰফাইল`],
    [`Your account details`, `आपके खाते की जानकारी`, `আপোনাৰ একাউণ্টৰ তথ্য`],
    [`Complete Name:`, `पूरा नाम:`, `সম্পূৰ্ণ নাম:`],
    [`Username:`, `यूज़रनेम:`, `ইউজাৰনেম:`],
    [`Gmail:`, `जीमेल:`, `জিমেইল:`],
    [`Age:`, `उम्र:`, `বয়স:`],
    [`Edit Profile`, `प्रोफ़ाइल बदलें`, `প্ৰফাইল সম্পাদনা কৰক`],
    [`Logout`, `लॉगआउट`, `লগআউট`],
    [`ADMIN / LIBRARY MANAGEMENT`, `एडमिन / लाइब्रेरी प्रबंधन`, `এডমিন / লাইব্ৰেৰী পৰিচালনা`],
    [`Create Playlist`, `प्लेलिस्ट बनाएँ`, `প্লেলিষ্ট সৃষ্টি কৰক`],
    [`Create a new collection`, `नया संग्रह बनाएँ`, `নতুন সংগ্ৰহ সৃষ্টি কৰক`],
    [`Upload Video`, `वीडियो अपलोड करें`, `ভিডিঅ' আপলোড কৰক`],
    [`Add a video to your library`, `अपनी लाइब्रेरी में वीडियो जोड़ें`, `আপোনাৰ লাইব্ৰেৰীত ভিডিঅ' যোগ কৰক`],
    [`Delete Playlist`, `प्लेलिस्ट हटाएँ`, `প্লেলিষ্ট মচি পেলাওক`],
    [`Remove a playlist`, `एक प्लेलिस्ट हटाएँ`, `এটা প্লেলিষ্ট আঁতৰাওক`],
    [`Delete Video`, `वीडियो हटाएँ`, `ভিডিঅ' মচি পেলাওক`],
    [`Remove a video`, `एक वीडियो हटाएँ`, `এটা ভিডিঅ' আঁতৰাওক`],
    [`Edit Playlist`, `प्लेलिस्ट संपादित करें`, `প্লেলিষ্ট সম্পাদনা কৰক`],
    [`Change title, cover or videos`, `शीर्षक, कवर या वीडियो बदलें`, `শিৰোনাম, কভাৰ বা ভিডিঅ' সলনি কৰক`],
    [`Edit Video`, `वीडियो संपादित करें`, `ভিডিঅ' সম্পাদনা কৰক`],
    [`Change details, files or audio`, `विवरण, फ़ाइलें या ऑडियो बदलें`, `বিৱৰণ, ফাইল বা অডিঅ' সলনি কৰক`],
    [`Update all details shown on your profile`, `अपनी प्रोफ़ाइल में दिखने वाली सारी जानकारी अपडेट करें`, `আপোনাৰ প্ৰফাইলত দেখুওৱা সকলো তথ্য আপডেট কৰক`],
    [`COMPLETE NAME`, `पूरा नाम`, `সম্পূৰ্ণ নাম`],
    [`USERNAME`, `यूज़रनेम`, `ইউজাৰনেম`],
    [`GMAIL (CANNOT BE CHANGED)`, `जीमेल (बदला नहीं जा सकता)`, `জিমেইল (সলনি কৰিব নোৱাৰি)`],
    [`AGE`, `उम्र`, `বয়স`],
    [`SAVE CHANGES`, `बदलाव सहेजें`, `পৰিৱৰ্তন সংৰক্ষণ কৰক`],
    [`CANCEL`, `रद्द करें`, `বাতিল কৰক`],
    [`Please enter valid details in every field.`, `कृपया हर जगह सही जानकारी डालें।`, `অনুগ্ৰহ কৰি প্ৰতিটো ঠাইত সঠিক তথ্য দিয়ক।`],
    [`Age must be a whole number between 18 and 120.`, `उम्र 18 से 120 के बीच की पूरी संख्या होनी चाहिए।`, `বয়স 18 ৰ পৰা 120 ৰ ভিতৰৰ এটা পূৰ্ণ সংখ্যা হ'ব লাগিব।`],
    [`That username is already taken.`, `वह यूज़रनेम पहले से लिया जा चुका है।`, `সেই ইউজাৰনেম আগতেই লোৱা হৈছে।`],
    [`Age must be between 18 and 120.`, `उम्र 18 से 120 के बीच होनी चाहिए।`, `বয়স 18 ৰ পৰা 120 ৰ ভিতৰত হ'ব লাগিব।`],
    [`Could not save. Please try again.`, `सहेजा नहीं जा सका। कृपया फिर कोशिश करें।`, `সংৰক্ষণ কৰিব পৰা নগ'ল। অনুগ্ৰহ কৰি পুনৰ চেষ্টা কৰক।`],
    [`Profile not found. Please logout and login again.`, `प्रोफ़ाइल नहीं मिली। कृपया लॉगआउट करके फिर लॉगिन करें।`, `প্ৰফাইল পোৱা নগ'ল। অনুগ্ৰহ কৰি লগআউট কৰি পুনৰ লগইন কৰক।`],
    [`Could not load your profile. Please refresh the page.`, `आपकी प्रोफ़ाइल लोड नहीं हो सकी। कृपया पेज रिफ़्रेश करें।`, `আপোনাৰ প্ৰফাইল লোড কৰিব পৰা নগ'ল। অনুগ্ৰহ কৰি পৃষ্ঠাখন ৰিফ্ৰেচ কৰক।`],
    [`Saving...`, `सहेजा जा रहा है...`, `সংৰক্ষণ কৰি থকা হৈছে...`],

    // ---- settings page ----
    [`DAY AND NIGHT`, `दिन और रात`, `দিন আৰু ৰাতি`],
    [`Day`, `दिन`, `দিন`],
    [`Night`, `रात`, `ৰাতি`],
    [`LANGUAGE`, `भाषा`, `ভাষা`],
    [`These choices are kept only in this browser. When you refresh the page, everything goes back to Night and English.`, `ये चुनाव सिर्फ़ इसी ब्राउज़र में रहते हैं। पेज रिफ़्रेश करने पर सब कुछ वापस रात और अंग्रेज़ी पर आ जाएगा।`, `এই বাছনিবোৰ কেৱল এই ব্ৰাউজাৰতহে থাকে। পৃষ্ঠাখন ৰিফ্ৰেচ কৰিলে সকলো আকৌ ৰাতি আৰু ইংৰাজীলৈ উভতি যাব।`],

    // ---- create / delete playlist & video ----
    [`Make a new collection for your videos.`, `अपने वीडियो के लिए नया संग्रह बनाएँ।`, `আপোনাৰ ভিডিঅ'ৰ বাবে নতুন সংগ্ৰহ বনাওক।`],
    [`PLAYLIST COVER IMAGE *`, `प्लेलिस्ट कवर इमेज *`, `প্লেলিষ্ট কভাৰ ছবি *`],
    [`PLAYLIST TITLE *`, `प्लेलिस्ट का शीर्षक *`, `প্লেলিষ্টৰ শিৰোনাম *`],
    [`Please provide a cover image and playlist title.`, `कृपया कवर इमेज और प्लेलिस्ट का शीर्षक दें।`, `অনুগ্ৰহ কৰি এখন কভাৰ ছবি আৰু প্লেলিষ্টৰ শিৰোনাম দিয়ক।`],
    [`Saving playlist...`, `प्लेलिस्ट सहेजी जा रही है...`, `প্লেলিষ্ট সংৰক্ষণ কৰি থকা হৈছে...`],
    [`Playlist created successfully!`, `प्लेलिस्ट सफलतापूर्वक बन गई!`, `প্লেলিষ্ট সফলভাৱে সৃষ্টি হ'ল!`],
    [`Please choose an image smaller than 12 MB.`, `कृपया 12 MB से छोटी इमेज चुनें।`, `অনুগ্ৰহ কৰি 12 MB তকৈ সৰু ছবি বাছনি কৰক।`],
    [`Choose an item and confirm before it is removed.`, `कोई आइटम चुनें और हटाने से पहले पुष्टि करें।`, `এটা বস্তু বাছনি কৰক আৰু আঁতৰোৱাৰ আগতে নিশ্চিত কৰক।`],
    [`Nothing to delete yet.`, `अभी हटाने के लिए कुछ नहीं है।`, `এতিয়ালৈকে মচিবলৈ একো নাই।`],
    [`CONFIRM DELETION`, `हटाने की पुष्टि करें`, `মচি পেলোৱাৰ নিশ্চিতকৰণ`],
    [`Are you sure you want to permanently delete this item?`, `क्या आप सच में इसे हमेशा के लिए हटाना चाहते हैं?`, `আপুনি সঁচাকৈয়ে এইটো চিৰদিনৰ বাবে মচি পেলাব বিচাৰেনে?`],
    [`Are you sure you want to permanently delete this playlist?`, `क्या आप सच में इस प्लेलिस्ट को हमेशा के लिए हटाना चाहते हैं?`, `আপুনি সঁচাকৈয়ে এই প্লেলিষ্টটো চিৰদিনৰ বাবে মচি পেলাব বিচাৰেনে?`],
    [`Are you sure you want to permanently delete this video?`, `क्या आप सच में इस वीडियो को हमेशा के लिए हटाना चाहते हैं?`, `আপুনি সঁচাকৈয়ে এই ভিডিঅ'টো চিৰদিনৰ বাবে মচি পেলাব বিচাৰেনে?`],
    [`Delete`, `हटाएँ`, `মচক`],
    [`Cancel`, `रद्द करें`, `বাতিল কৰক`],
    [`Delete failed.`, `हटाना विफल रहा।`, `মচি পেলোৱা বিফল হ'ল।`],
    [`Could not load your data. Please refresh the page and try again.`, `आपका डेटा लोड नहीं हो सका। कृपया पेज रिफ़्रेश करके फिर कोशिश करें।`, `আপোনাৰ তথ্য লোড কৰিব পৰা নগ'ল। অনুগ্ৰহ কৰি পৃষ্ঠাখন ৰিফ্ৰেচ কৰি পুনৰ চেষ্টা কৰক।`],

    // ---- edit playlist ----
    [`Choose a playlist to change its title, cover image or the videos inside it.`, `प्लेलिस्ट चुनें और उसका शीर्षक, कवर इमेज या उसके वीडियो बदलें।`, `প্লেলিষ্ট বাছনি কৰি ইয়াৰ শিৰোনাম, কভাৰ ছবি বা ভিডিঅ' সলনি কৰক।`],
    [`Search by title...`, `शीर्षक से खोजें...`, `শিৰোনামেৰে সন্ধান কৰক...`],
    [`Nothing to edit yet.`, `अभी संपादित करने के लिए कुछ नहीं है।`, `এতিয়ালৈকে সম্পাদনা কৰিবলৈ একো নাই।`],
    [`No playlist matches your search.`, `आपकी खोज से कोई प्लेलिस्ट मेल नहीं खाती।`, `আপোনাৰ সন্ধানৰ লগত কোনো প্লেলিষ্ট মিলা নাই।`],
    [`No video matches your search.`, `आपकी खोज से कोई वीडियो मेल नहीं खाता।`, `আপোনাৰ সন্ধানৰ লগত কোনো ভিডিঅ' মিলা নাই।`],
    [`EDIT`, `संपादित करें`, `সম্পাদনা কৰক`],
    [`Back to list`, `सूची पर वापस`, `তালিকালৈ উভতি যাওক`],
    [`Only change what you need. Nothing is saved until you press Save.`, `सिर्फ़ वही बदलें जो ज़रूरी है। जब तक आप सेव नहीं दबाते, कुछ भी सहेजा नहीं जाएगा।`, `কেৱল প্ৰয়োজনীয়খিনি সলনি কৰক। আপুনি ছেভ নেটিপালৈকে একো সংৰক্ষণ কৰা নহয়।`],
    [`COVER IMAGE`, `कवर इमेज`, `কভাৰ ছবি`],
    [`CHOOSE A NEW COVER (OPTIONAL)`, `नया कवर चुनें (वैकल्पिक)`, `নতুন কভাৰ বাছনি কৰক (ঐচ্ছিক)`],
    [`VIDEOS IN THIS PLAYLIST`, `इस प्लेलिस्ट के वीडियो`, `এই প্লেলিষ্টৰ ভিডিঅ'`],
    [`No videos in this playlist yet.`, `इस प्लेलिस्ट में अभी कोई वीडियो नहीं है।`, `এই প্লেলিষ্টত এতিয়ালৈকে কোনো ভিডিঅ' নাই।`],
    [`"Remove" only takes the video out of this playlist. The video itself is not deleted.`, `"हटाएँ" सिर्फ़ वीडियो को इस प्लेलिस्ट से बाहर करता है। वीडियो खुद नहीं हटता।`, `"আঁতৰাওক" এ কেৱল ভিডিঅ'টো এই প্লেলিষ্টৰ পৰা আঁতৰায়। ভিডিঅ'টো নিজে মচি পেলোৱা নহয়।`],
    [`ADD VIDEOS TO THIS PLAYLIST`, `इस प्लेलिस्ट में वीडियो जोड़ें`, `এই প্লেলিষ্টত ভিডিঅ' যোগ কৰক`],
    [`No other videos to add.`, `जोड़ने के लिए कोई और वीडियो नहीं है।`, `যোগ কৰিবলৈ আন কোনো ভিডিঅ' নাই।`],
    [`A video can be in only one playlist, so a video that is in another playlist will be moved here.`, `एक वीडियो सिर्फ़ एक ही प्लेलिस्ट में रह सकता है, इसलिए किसी दूसरी प्लेलिस्ट का वीडियो यहाँ ले आया जाएगा।`, `এটা ভিডিঅ' কেৱল এটা প্লেলিষ্টতহে থাকিব পাৰে, গতিকে আন প্লেলিষ্টৰ ভিডিঅ' ইয়ালৈ স্থানান্তৰ কৰা হ'ব।`],
    [`REMOVE`, `हटाएँ`, `আঁতৰাওক`],
    [`UNDO`, `पूर्ववत करें`, `আগৰ অৱস্থালৈ যাওক`],
    [`another playlist`, `दूसरी प्लेलिस्ट`, `আন এটা প্লেলিষ্ট`],
    [`No playlist`, `कोई प्लेलिस्ट नहीं`, `প্লেলিষ্ট নাই`],
    [`Title is required.`, `शीर्षक ज़रूरी है।`, `শিৰোনাম আৱশ্যক।`],
    [`Please choose a cover smaller than 12 MB.`, `कृपया 12 MB से छोटा कवर चुनें।`, `অনুগ্ৰহ কৰি 12 MB তকৈ সৰু কভাৰ বাছনি কৰক।`],
    [`Removing videos from the playlist...`, `वीडियो प्लेलिस्ट से हटाए जा रहे हैं...`, `ভিডিঅ'বোৰ প্লেলিষ্টৰ পৰা আঁতৰোৱা হৈছে...`],
    [`Adding videos to the playlist...`, `वीडियो प्लेलिस्ट में जोड़े जा रहे हैं...`, `ভিডিঅ'বোৰ প্লেলিষ্টত যোগ কৰি থকা হৈছে...`],
    [`Nothing was changed.`, `कुछ भी नहीं बदला।`, `একো সলনি কৰা হোৱা নাই।`],
    [`Saved successfully!`, `सफलतापूर्वक सहेजा गया!`, `সফলভাৱে সংৰক্ষণ কৰা হ'ল!`],
    [`please try again.`, `कृपया फिर कोशिश करें।`, `অনুগ্ৰহ কৰি পুনৰ চেষ্টা কৰক।`],
    [`Reload the page to see the current state.`, `मौजूदा स्थिति देखने के लिए पेज रीलोड करें।`, `বৰ্তমান অৱস্থা চাবলৈ পৃষ্ঠাখন ৰিলোড কৰক।`],

    // ---- edit video / upload video ----
    [`Choose a video to change its title, playlist, category, thumbnail, video file or audios.`, `वीडियो चुनें और उसका शीर्षक, प्लेलिस्ट, श्रेणी, थंबनेल, वीडियो फ़ाइल या ऑडियो बदलें।`, `ভিডিঅ' বাছনি কৰি ইয়াৰ শিৰোনাম, প্লেলিষ্ট, শ্ৰেণী, থাম্বনেইল, ভিডিঅ' ফাইল বা অডিঅ' সলনি কৰক।`],
    [`Only change what you need. Anything you leave as it is stays as it is.`, `सिर्फ़ वही बदलें जो ज़रूरी है। जिसे आप नहीं छेड़ेंगे वह जैसा है वैसा ही रहेगा।`, `কেৱল প্ৰয়োজনীয়খিনি সলনি কৰক। আপুনি যিটো নোসোলোৱে সেইটো যেনে আছে তেনেকৈয়ে থাকিব।`],
    [`Open this video`, `यह वीडियो खोलें`, `এই ভিডিঅ'টো খোলক`],
    [`VIDEO TITLE *`, `वीडियो का शीर्षक *`, `ভিডিঅ'ৰ শিৰোনাম *`],
    [`-- No Playlist (General Library) --`, `-- कोई प्लेलिस्ट नहीं (सामान्य लाइब्रेरी) --`, `-- প্লেলিষ্ট নাই (সাধাৰণ লাইব্ৰেৰী) --`],
    [`Pick another playlist to move the video, or "No Playlist" to take it out of its playlist (the video itself is not deleted).`, `वीडियो को दूसरी प्लेलिस्ट में ले जाने के लिए नई प्लेलिस्ट चुनें, या उसे प्लेलिस्ट से बाहर करने के लिए "कोई प्लेलिस्ट नहीं" चुनें (वीडियो खुद नहीं हटता)।`, `ভিডিঅ'টো আন প্লেলিষ্টলৈ নিবলৈ নতুন প্লেলিষ্ট বাছনি কৰক, বা প্লেলিষ্টৰ পৰা আঁতৰাবলৈ "প্লেলিষ্ট নাই" বাছনি কৰক (ভিডিঅ'টো নিজে মচি পেলোৱা নহয়)।`],
    [`CATEGORY *`, `श्रेणी *`, `শ্ৰেণী *`],
    [`-- Select Category --`, `-- श्रेणी चुनें --`, `-- শ্ৰেণী বাছনি কৰক --`],
    [`THUMBNAIL`, `थंबनेल`, `থাম্বনেইল`],
    [`CHOOSE A NEW THUMBNAIL (OPTIONAL)`, `नया थंबनेल चुनें (वैकल्पिक)`, `নতুন থাম্বনেইল বাছনি কৰক (ঐচ্ছিক)`],
    [`VIDEO FILE`, `वीडियो फ़ाइल`, `ভিডিঅ' ফাইল`],
    [`REPLACE THE VIDEO FILE (OPTIONAL, MP4 / WEBM, MAX 1 GB)`, `वीडियो फ़ाइल बदलें (वैकल्पिक, MP4 / WEBM, अधिकतम 1 GB)`, `ভিডিঅ' ফাইল সলনি কৰক (ঐচ্ছিক, MP4 / WEBM, সৰ্বাধিক 1 GB)`],
    [`The old video file is deleted after the new one is saved. Views and likes stay. If this video has dub audios, each one must still match the new video's length (within 0.5 second), otherwise replace or remove that audio too.`, `नई फ़ाइल सहेजने के बाद पुरानी वीडियो फ़ाइल हटा दी जाती है। व्यूज़ और लाइक्स बने रहते हैं। अगर इस वीडियो में डब ऑडियो हैं, तो हर ऑडियो की लंबाई नए वीडियो से (0.5 सेकंड के अंदर) मिलनी चाहिए, नहीं तो उस ऑडियो को भी बदलें या हटाएँ।`, `নতুন ফাইল সংৰক্ষণ কৰাৰ পিছত পুৰণি ভিডিঅ' ফাইল মচি পেলোৱা হয়। ভিউ আৰু লাইক থাকি যায়। যদি এই ভিডিঅ'ত ডাব অডিঅ' আছে, প্ৰতিটো অডিঅ'ৰ দৈৰ্ঘ্য নতুন ভিডিঅ'ৰ সৈতে (0.5 ছেকেণ্ডৰ ভিতৰত) মিলিব লাগিব, নহ'লে সেই অডিঅ'টোও সলনি কৰক বা আঁতৰাওক।`],
    [`DUB / EXTRA AUDIO`, `डब / अतिरिक्त ऑडियो`, `ডাব / অতিৰিক্ত অডিঅ'`],
    [`DUB / EXTRA AUDIO (OPTIONAL)`, `डब / अतिरिक्त ऑडियो (वैकल्पिक)`, `ডাব / অতিৰিক্ত অডিঅ' (ঐচ্ছিক)`],
    [`This video has no extra audio yet.`, `इस वीडियो में अभी कोई अतिरिक्त ऑडियो नहीं है।`, `এই ভিডিঅ'ত এতিয়ালৈকে কোনো অতিৰিক্ত অডিঅ' নাই।`],
    [`+ ADD AUDIO`, `+ ऑडियो जोड़ें`, `+ অডিঅ' যোগ কৰক`],
    [`You can rename an audio, replace its file, or remove it. Every audio must be the same length as the video (within 0.5 second). MP3, M4A, OGG or WAV. Up to 8 audios in total.`, `आप ऑडियो का नाम बदल सकते हैं, उसकी फ़ाइल बदल सकते हैं या उसे हटा सकते हैं। हर ऑडियो की लंबाई वीडियो जितनी (0.5 सेकंड के अंदर) होनी चाहिए। MP3, M4A, OGG या WAV। कुल मिलाकर अधिकतम 8 ऑडियो।`, `আপুনি অডিঅ'ৰ নাম সলনি কৰিব পাৰে, ফাইল সলনি কৰিব পাৰে বা আঁতৰাব পাৰে। প্ৰতিটো অডিঅ'ৰ দৈৰ্ঘ্য ভিডিঅ'ৰ সমান (0.5 ছেকেণ্ডৰ ভিতৰত) হ'ব লাগিব। MP3, M4A, OGG বা WAV। মুঠ সৰ্বাধিক 8টা অডিঅ'।`],
    [`Replace the file (optional)`, `फ़ाइल बदलें (वैकल्पिक)`, `ফাইল সলনি কৰক (ঐচ্ছিক)`],
    [`Name (e.g. Hindi)`, `नाम (जैसे हिंदी)`, `নাম (যেনে হিন্দী)`],
    [`Audio name`, `ऑडियो का नाम`, `অডিঅ'ৰ নাম`],
    [`Remove audio`, `ऑडियो हटाएँ`, `অডিঅ' আঁতৰাওক`],
    [`Checking audio length...`, `ऑडियो की लंबाई जाँची जा रही है...`, `অডিঅ'ৰ দৈৰ্ঘ্য পৰীক্ষা কৰি থকা হৈছে...`],
    [`Saving details...`, `विवरण सहेजे जा रहे हैं...`, `বিৱৰণ সংৰক্ষণ কৰি থকা হৈছে...`],
    [`Saving new audios...`, `नए ऑडियो सहेजे जा रहे हैं...`, `নতুন অডিঅ' সংৰক্ষণ কৰি থকা হৈছে...`],
    [`Please select a category.`, `कृपया श्रेणी चुनें।`, `অনুগ্ৰহ কৰি এটা শ্ৰেণী বাছনি কৰক।`],
    [`Please choose a thumbnail smaller than 12 MB.`, `कृपया 12 MB से छोटा थंबनेल चुनें।`, `অনুগ্ৰহ কৰি 12 MB তকৈ সৰু থাম্বনেইল বাছনি কৰক।`],
    [`Please choose a video smaller than 1 GB.`, `कृपया 1 GB से छोटा वीडियो चुनें।`, `অনুগ্ৰহ কৰি 1 GB তকৈ সৰু ভিডিঅ' বাছনি কৰক।`],
    [`A video can have up to 8 audios.`, `एक वीडियो में अधिकतम 8 ऑडियो हो सकते हैं।`, `এটা ভিডিঅ'ত সৰ্বাধিক 8টা অডিঅ' থাকিব পাৰে।`],
    [`You can add up to 8 audios.`, `आप अधिकतम 8 ऑडियो जोड़ सकते हैं।`, `আপুনি সৰ্বাধিক 8টা অডিঅ' যোগ কৰিব পাৰে।`],
    [`Every audio needs a name.`, `हर ऑडियो का एक नाम होना ज़रूरी है।`, `প্ৰতিটো অডিঅ'ৰ এটা নাম থাকিব লাগিব।`],
    [`Every new audio needs both a name and a file.`, `हर नए ऑडियो के लिए नाम और फ़ाइल दोनों चाहिए।`, `প্ৰতিটো নতুন অডিঅ'ৰ বাবে নাম আৰু ফাইল দুয়োটা লাগে।`],
    [`Every audio needs both a name and a file.`, `हर ऑडियो के लिए नाम और फ़ाइल दोनों चाहिए।`, `প্ৰতিটো অডিঅ'ৰ বাবে নাম আৰু ফাইল দুয়োটা লাগে।`],
    [`The name "Original" is already used for the video's own sound.`, `"Original" नाम वीडियो की अपनी आवाज़ के लिए पहले से इस्तेमाल हो रहा है।`, `"Original" নামটো ভিডিঅ'ৰ নিজৰ শব্দৰ বাবে আগতেই ব্যৱহাৰ হৈছে।`],
    [`Add a video and thumbnail to your library.`, `अपनी लाइब्रेरी में वीडियो और थंबनेल जोड़ें।`, `আপোনাৰ লাইব্ৰেৰীত ভিডিঅ' আৰু থাম্বনেইল যোগ কৰক।`],
    [`THUMBNAIL IMAGE *`, `थंबनेल इमेज *`, `থাম্বনেইল ছবি *`],
    [`VIDEO FILE (MP4 / WEBM) *`, `वीडियो फ़ाइल (MP4 / WEBM) *`, `ভিডিঅ' ফাইল (MP4 / WEBM) *`],
    [`Give each audio a name (English, Hindi, Japanese...). Its length must match the video (within 0.5 second). MP3, M4A, OGG or WAV.`, `हर ऑडियो को एक नाम दें (English, Hindi, Japanese...)। उसकी लंबाई वीडियो से (0.5 सेकंड के अंदर) मिलनी चाहिए। MP3, M4A, OGG या WAV।`, `প্ৰতিটো অডিঅ'ক এটা নাম দিয়ক (English, Hindi, Japanese...)। ইয়াৰ দৈৰ্ঘ্য ভিডিঅ'ৰ সৈতে (0.5 ছেকেণ্ডৰ ভিতৰত) মিলিব লাগিব। MP3, M4A, OGG বা WAV।`],
    [`ADD TO PLAYLIST`, `प्लेलिस्ट में जोड़ें`, `প্লেলিষ্টত যোগ কৰক`],
    [`Thumbnail, video file, and title are required.`, `थंबनेल, वीडियो फ़ाइल और शीर्षक ज़रूरी हैं।`, `থাম্বনেইল, ভিডিঅ' ফাইল আৰু শিৰোনাম আৱশ্যক।`],
    [`Video uploaded successfully!`, `वीडियो सफलतापूर्वक अपलोड हो गया!`, `ভিডিঅ' সফলভাৱে আপলোড হ'ল!`]
  ];

  const IDX = { hi: 0, as: 1 };
  const exact = new Map();
  const loose = new Map();
  RAW.forEach(r => {
    exact.set(r[0], [r[1], r[2]]);
    loose.set(r[0].toLowerCase(), [r[1], r[2]]);
  });
  const find = core => exact.get(core) || loose.get(core.toLowerCase()) || null;

  // ---- text that contains numbers / names / another message ----
  const WORD = { thumbnail: [`थंबनेल`, `থাম্বনেইল`], video: [`वीडियो`, `ভিডিঅ'`], cover: [`कवर`, `কভাৰ`] };

  const prefix = (en, hi, as) => [
    new RegExp('^' + en + ': (.+)$'),
    (m, i) => [hi, as][i] + ': ' + (tr(m[1], i) || m[1])
  ];

  const P = [
    [/^(\d+) Views?$/, (m, i) => [m[1] + ` व्यूज़`, m[1] + ` ভিউ`][i]],
    [/^(\d+) Videos?$/, (m, i) => [m[1] + ` वीडियो`, m[1] + ` টা ভিডিঅ'`][i]],
    [/^(\d+) video\(s\)$/, (m, i) => [m[1] + ` वीडियो`, m[1] + ` টা ভিডিঅ'`][i]],
    [/^(\d+) years old$/, (m, i) => [m[1] + ` साल`, m[1] + ` বছৰ`][i]],
    [/^Now in: (.+)$/, (m, i) => [`अभी इसमें: `, `বৰ্তমান ইয়াত: `][i] + (tr(m[1], i) || m[1])],
    [/^(.+) \| NOW ENJOY$/, (m, i) => { const t = find(m[1]); return t ? t[i] + ' | NOW ENJOY' : null; }],
    [/^Uploading (thumbnail|video|cover)\.\.\.(?: (\d+)%)?$/, (m, i) =>
      WORD[m[1]][i] + [` अपलोड हो रहा है...`, ` আপলোড হৈ আছে...`][i] + (m[2] != null ? ' ' + m[2] + '%' : '')],
    [/^Uploading audio "(.+)"\.\.\. (\d+)%$/, (m, i) =>
      [`ऑडियो "${m[1]}" अपलोड हो रहा है... ${m[2]}%`, `অডিঅ' "${m[1]}" আপলোড হৈ আছে... ${m[2]}%`][i]],
    [/^Uploading audio (\d+)\/(\d+) \((.+)\)\.\.\. (\d+)%$/, (m, i) =>
      [`ऑडियो ${m[1]}/${m[2]} (${m[3]}) अपलोड हो रहा है... ${m[4]}%`, `অডিঅ' ${m[1]}/${m[2]} (${m[3]}) আপলোড হৈ আছে... ${m[4]}%`][i]],
    [/^Removing audio "(.+)"\.\.\.$/, (m, i) =>
      [`ऑडियो "${m[1]}" हटाया जा रहा है...`, `অডিঅ' "${m[1]}" আঁতৰোৱা হৈছে...`][i]],
    [/^Saving audio "(.+)"\.\.\.$/, (m, i) =>
      [`ऑडियो "${m[1]}" सहेजा जा रहा है...`, `অডিঅ' "${m[1]}" সংৰক্ষণ কৰি থকা হৈছে...`][i]],
    [/^Two audios have the same name: (.+)$/, (m, i) =>
      [`दो ऑडियो का नाम एक जैसा है: ${m[1]}`, `দুটা অডিঅ'ৰ নাম একে: ${m[1]}`][i]],
    [/^Audio "(.+)" must be MP3, M4A, OGG or WAV\.$/, (m, i) =>
      [`ऑडियो "${m[1]}" MP3, M4A, OGG या WAV होना चाहिए।`, `অডিঅ' "${m[1]}" MP3, M4A, OGG বা WAV হ'ব লাগিব।`][i]],
    [/^Audio "(.+)" is ([\d.]+) s but the (new video|video) is ([\d.]+) s\. The difference must be within ([\d.]+) s\.$/, (m, i) =>
      [`ऑडियो "${m[1]}" ${m[2]} सेकंड का है, लेकिन ${m[3] === 'video' ? 'वीडियो' : 'नया वीडियो'} ${m[4]} सेकंड का है। अंतर ${m[5]} सेकंड के अंदर होना चाहिए।`,
       `অডিঅ' "${m[1]}" ${m[2]} ছেকেণ্ডৰ, কিন্তু ${m[3] === 'video' ? 'ভিডিঅ\'' : 'নতুন ভিডিঅ\''} ${m[4]} ছেকেণ্ডৰ। পাৰ্থক্য ${m[5]} ছেকেণ্ডৰ ভিতৰত হ'ব লাগিব।`][i]],
    [/^The existing audio "(.+)" is ([\d.]+) s but the new video is ([\d.]+) s\. Replace or remove that audio too\.$/, (m, i) =>
      [`मौजूदा ऑडियो "${m[1]}" ${m[2]} सेकंड का है, लेकिन नया वीडियो ${m[3]} सेकंड का है। उस ऑडियो को भी बदलें या हटाएँ।`,
       `বৰ্তমানৰ অডিঅ' "${m[1]}" ${m[2]} ছেকেণ্ডৰ, কিন্তু নতুন ভিডিঅ'টো ${m[3]} ছেকেণ্ডৰ। সেই অডিঅ'টোও সলনি কৰক বা আঁতৰাওক।`][i]],
    [/^Almost done! We sent a confirmation link to (\S+)\. Your account becomes active only after you confirm your email\. Check your inbox \(and spam folder\), click the link, then login\.$/, (m, i) =>
      [`लगभग हो गया! हमने ${m[1]} पर एक पुष्टि लिंक भेजा है। आपका खाता तभी चालू होगा जब आप अपना ईमेल कन्फ़र्म करेंगे। अपना इनबॉक्स (और स्पैम फ़ोल्डर) देखें, लिंक पर क्लिक करें, फिर लॉगिन करें।`,
       `প্ৰায় হৈ গ'ল! আমি ${m[1]} লৈ এটা নিশ্চিতকৰণ লিংক পঠিয়াইছোঁ। আপুনি ইমেইল নিশ্চিত কৰাৰ পিছতহে আপোনাৰ একাউণ্ট সক্ৰিয় হ'ব। আপোনাৰ ইনবক্স (আৰু স্পেম ফোল্ডাৰ) চাওক, লিংকত ক্লিক কৰক, তাৰ পিছত লগইন কৰক।`][i]],
    [/^Some changes were saved, but not all: (.+?)( Reload the page to see the current state\.)?$/, (m, i) =>
      [`कुछ बदलाव सहेजे गए, लेकिन सभी नहीं: `, `কিছু পৰিৱৰ্তন সংৰক্ষণ কৰা হ'ল, কিন্তু সকলো নহয়: `][i] + (tr(m[1], i) || m[1]) + (m[2] ? ' ' + tr('Reload the page to see the current state.', i) : '')],
    prefix('Could not create playlist', `प्लेलिस्ट नहीं बन सकी`, `প্লেলিষ্ট সৃষ্টি কৰিব পৰা নগ'ল`),
    prefix('Could not save', `सहेजा नहीं जा सका`, `সংৰক্ষণ কৰিব পৰা নগ'ল`),
    prefix('Upload failed', `अपलोड विफल रहा`, `আপলোড বিফল হ'ল`),
    prefix('Video saved, but the audio could not be saved', `वीडियो सहेज लिया गया, लेकिन ऑडियो नहीं सहेजा जा सका`, `ভিডিঅ' সংৰক্ষণ কৰা হ'ল, কিন্তু অডিঅ' সংৰক্ষণ কৰিব পৰা নগ'ল`)
  ];

  function tr(core, i) {
    const hit = find(core);
    if (hit) return hit[i];
    for (let k = 0; k < P.length; k++) {
      const m = P[k][0].exec(core);
      if (m) {
        const r = P[k][1](m, i);
        if (r != null) return r;
      }
    }
    return null;
  }

  let lang = 'en';
  let idx = 0;

  // keeps spaces at the start / end, ignores line breaks inside the text
  function trString(s, i) {
    const core = String(s).trim().replace(/\s+/g, ' ');
    if (!core) return s;
    const r = tr(core, i);
    if (r == null) return s;
    return String(s).match(/^\s*/)[0] + r + String(s).match(/\s*$/)[0];
  }

  // ---- walking the page ----
  const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'CODE', 'PRE']);
  const ATTRS = ['placeholder', 'aria-label', 'title'];
  const textState = new WeakMap(); // text node -> { orig, out }
  const attrState = new WeakMap(); // element -> { attr: { orig, out } }

  function skipped(el) {
    for (; el && el.nodeType === 1; el = el.parentNode) {
      if (SKIP.has(el.tagName)) return true;
      if (el.getAttribute('translate') === 'no' || el.classList.contains('notranslate')) return true;
    }
    return false;
  }

  function doText(n) {
    if (!n.parentNode || skipped(n.parentNode)) return;
    const cur = n.nodeValue;
    let rec = textState.get(n);
    if (!rec || rec.out !== cur) rec = { orig: cur, out: cur }; // the page wrote new text
    const res = lang === 'en' ? rec.orig : trString(rec.orig, idx);
    rec.out = res;
    textState.set(n, rec);
    if (res !== cur) n.nodeValue = res;
  }

  function doAttr(el, a) {
    if (!el.hasAttribute(a) || skipped(el)) return;
    let all = attrState.get(el);
    if (!all) { all = {}; attrState.set(el, all); }
    const cur = el.getAttribute(a);
    let rec = all[a];
    if (!rec || rec.out !== cur) rec = all[a] = { orig: cur, out: cur };
    const res = lang === 'en' ? rec.orig : trString(rec.orig, idx);
    rec.out = res;
    if (res !== cur) el.setAttribute(a, res);
  }

  function walk(node) {
    if (node.nodeType === 3) { doText(node); return; }
    if (node.nodeType !== 1) return;
    ATTRS.forEach(a => doAttr(node, a));
    const tw = document.createTreeWalker(node, 1 | 4); // elements + text
    let n;
    while ((n = tw.nextNode())) {
      if (n.nodeType === 3) doText(n);
      else ATTRS.forEach(a => doAttr(n, a));
    }
  }

  function apply(code) {
    lang = IDX[code] != null ? code : 'en';
    idx = lang === 'en' ? 0 : IDX[lang];
    document.documentElement.lang = lang;
    walk(document.documentElement);
  }

  // alert() messages are translated too
  const nativeAlert = window.alert;
  window.alert = function (msg) {
    return nativeAlert.call(window, lang === 'en' ? msg : trString(String(msg), idx));
  };

  window.NowEnjoyI18n = {
    apply,
    get lang() { return lang; },
    translate: (text, code) => trString(text, IDX[code] != null ? IDX[code] : 0)
  };

  // anything the page adds or changes later is translated as it appears
  new MutationObserver(list => {
    for (const m of list) {
      if (m.type === 'childList') m.addedNodes.forEach(walk);
      else if (m.type === 'characterData') doText(m.target);
      else if (m.type === 'attributes') doAttr(m.target, m.attributeName);
    }
  }).observe(document.documentElement, {
    childList: true, subtree: true, characterData: true,
    attributes: true, attributeFilter: ATTRS
  });

  apply(window.NowEnjoySettings ? window.NowEnjoySettings.lang : 'en');
})();
