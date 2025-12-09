import React, { useState, useEffect, useRef } from 'react';
import { Volume2, CheckCircle, AlertCircle, BookOpen, GraduationCap, X, Plus, Trash2, Save, Loader2, Sparkles, Clock, FileText, Download, LogOut, User, LogIn, ExternalLink, Filter, KeyRound, Settings, Check, Zap, Activity, PenLine, ChevronDown, ChevronUp, StickyNote, Search, Pencil, Edit3, NotebookPen, Library, ListChecks, Database, Square, CheckSquare, Globe, ArrowRight } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, writeBatch, serverTimestamp } from 'firebase/firestore';

// ==========================================
// 🔴 設定區：已填入您的 Firebase Keys
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyDVqPF-W_z4lvkuVMfllRLW2fVBji4uzp0",
  authDomain: "german-words-5587e.firebaseapp.com",
  projectId: "german-words-5587e",
  storageBucket: "german-words-5587e.firebasestorage.app",
  messagingSenderId: "828187409950",
  appId: "1:828187409950:web:16a712b992f6965abbb80f"
};

// Gemini API Key (已填入您的 Key)
const GEMINI_API_KEY = "AIzaSyAtoBHF5-axdlUEGQvW4Ch1GJxIOIF7fos"; 

// ==========================================
// 📚 內建單字庫：A1 等級
// ==========================================
const BUILT_IN_WORDS_A1 = [
  { word: 'Hallo', article: '', plural: '', meaning: '哈囉', englishMeaning: 'Hello', level: 'A1', type: 'interjection', conjugation: '', example: 'Hallo, wie geht es dir?', exampleMeaning: '哈囉，你過得如何？' },
{ word: 'Tschüss', article: '', plural: '', meaning: '再見', englishMeaning: 'Bye', level: 'A1', type: 'interjection', conjugation: '', example: 'Tschüss, bis morgen!', exampleMeaning: '再見，明天見！' },
{ word: 'danke', article: '', plural: '', meaning: '謝謝', englishMeaning: 'thank you', level: 'A1', type: 'interjection', conjugation: '', example: 'Vielen Dank für die Hilfe.', exampleMeaning: '非常感謝你的幫助。' },
{ word: 'bitte', article: '', plural: '', meaning: '請；不客氣', englishMeaning: 'please; you re welcome', level: 'A1', type: 'interjection', conjugation: '', example: 'Können Sie mir bitte helfen?', exampleMeaning: '您能幫我一下嗎？' },
{ word: 'sprechen', article: '', plural: '', meaning: '說話', englishMeaning: 'to speak', level: 'A1', type: 'verb', conjugation: 'er spricht, sprach, hat gesprochen', example: 'Ich spreche ein bisschen Deutsch.', exampleMeaning: '我會說一點德語。' },
{ word: 'heißen', article: '', plural: '', meaning: '名字是', englishMeaning: 'to be called', level: 'A1', type: 'verb', conjugation: 'er heißt, hieß, hat geheißen', example: 'Wie heißen Sie?', exampleMeaning: '您叫什麼名字？' },
{ word: 'kommen', article: '', plural: '', meaning: '來', englishMeaning: 'to come', level: 'A1', type: 'verb', conjugation: 'er kommt, kam, ist gekommen', example: 'Woher kommen Sie?', exampleMeaning: '您從哪裡來？' },
{ word: 'wohnen', article: '', plural: '', meaning: '居住', englishMeaning: 'to live', level: 'A1', type: 'verb', conjugation: 'er wohnt, wohnte, hat gewohnt', example: 'Ich wohne in Berlin.', exampleMeaning: '我住在柏林。' },
{ word: 'lernen', article: '', plural: '', meaning: '學習', englishMeaning: 'to learn', level: 'A1', type: 'verb', conjugation: 'er lernt, lernte, hat gelernt', example: 'Wir lernen Deutsch.', exampleMeaning: '我們在學德語。' },
{ word: 'fahren', article: '', plural: '', meaning: '開車；搭乘', englishMeaning: 'to drive; to ride', level: 'A1', type: 'verb', conjugation: 'er fährt, fuhr, ist gefahren', example: 'Fährst du mit dem Bus?', exampleMeaning: '你搭公車嗎？' },
{ word: 'haben', article: '', plural: '', meaning: '有', englishMeaning: 'to have', level: 'A1', type: 'verb', conjugation: 'er hat, hatte, hat gehabt', example: 'Ich habe eine Frage.', exampleMeaning: '我有一個問題。' },
{ word: 'sein', article: '', plural: '', meaning: '是', englishMeaning: 'to be', level: 'A1', type: 'verb', conjugation: 'er ist, war, ist gewesen', example: 'Das ist mein Bruder.', exampleMeaning: '這是我的兄弟。' },
{ word: 'gehen', article: '', plural: '', meaning: '走；去', englishMeaning: 'to go', level: 'A1', type: 'verb', conjugation: 'er geht, ging, ist gegangen', example: 'Wir gehen ins Kino.', exampleMeaning: '我們去看電影。' },
{ word: 'machen', article: '', plural: '', meaning: '做', englishMeaning: 'to do; to make', level: 'A1', type: 'verb', conjugation: 'er macht, machte, hat gemacht', example: 'Was machst du gerade?', exampleMeaning: '你現在正在做什麼？' },
{ word: 'kaufen', article: '', plural: '', meaning: '買', englishMeaning: 'to buy', level: 'A1', type: 'verb', conjugation: 'er kauft, kaufte, hat gekauft', example: 'Ich kaufe Brot.', exampleMeaning: '我買麵包。' },
{ word: 'essen', article: '', plural: '', meaning: '吃', englishMeaning: 'to eat', level: 'A1', type: 'verb', conjugation: 'er isst, aß, hat gegessen', example: 'Was isst du zum Frühstück?', exampleMeaning: '你早餐吃什麼？' },
{ word: 'trinken', article: '', plural: '', meaning: '喝', englishMeaning: 'to drink', level: 'A1', type: 'verb', conjugation: 'er trinkt, trank, hat getrunken', example: 'Möchtest du etwas trinken?', exampleMeaning: '你想喝點什麼嗎？' },
{ word: 'lesen', article: '', plural: '', meaning: '讀', englishMeaning: 'to read', level: 'A1', type: 'verb', conjugation: 'er liest, las, hat gelesen', example: 'Er liest ein Buch.', exampleMeaning: '他在讀一本書。' },
{ word: 'sehen', article: '', plural: '', meaning: '看', englishMeaning: 'to see', level: 'A1', type: 'verb', conjugation: 'er sieht, sah, hat gesehen', example: 'Siehst du den Hund?', exampleMeaning: '你看見那隻狗了嗎？' },
{ word: 'finden', article: '', plural: '', meaning: '找到；覺得', englishMeaning: 'to find; to think', level: 'A1', type: 'verb', conjugation: 'er findet, fand, hat gefunden', example: 'Ich finde das toll.', exampleMeaning: '我覺得這很棒。' },
{ word: 'mögen', article: '', plural: '', meaning: '喜歡', englishMeaning: 'to like', level: 'A1', type: 'verb', conjugation: 'er mag, mochte, hat gemocht', example: 'Ich mag Schokolade.', exampleMeaning: '我喜歡巧克力。' },
{ word: 'können', article: '', plural: '', meaning: '能夠；會', englishMeaning: 'can; to be able to', level: 'A1', type: 'verb', conjugation: 'er kann, konnte, hat gekonnt', example: 'Kannst du schwimmen?', exampleMeaning: '你會游泳嗎？' },
{ word: 'müssen', article: '', plural: '', meaning: '必須', englishMeaning: 'must; to have to', level: 'A1', type: 'verb', conjugation: 'er muss, musste, hat gemusst', example: 'Ich muss jetzt gehen.', exampleMeaning: '我現在必須走了。' },
{ word: 'wollen', article: '', plural: '', meaning: '想要', englishMeaning: 'to want', level: 'A1', type: 'verb', conjugation: 'er will, wollte, hat gewollt', example: 'Wir wollen ein Eis essen.', exampleMeaning: '我們想吃冰淇淋。' },
{ word: 'dürfen', article: '', plural: '', meaning: '允許', englishMeaning: 'may; to be allowed to', level: 'A1', type: 'verb', conjugation: 'er darf, durfte, hat gedurft', example: 'Darf ich hier rauchen?', exampleMeaning: '我可以在這裡抽煙嗎？' },
{ word: 'sollen', article: '', plural: '', meaning: '應該', englishMeaning: 'should; ought to', level: 'A1', type: 'verb', conjugation: 'er soll, sollte, hat gesollt', example: 'Soll ich dir helfen?', exampleMeaning: '我應該幫助你嗎？' },
{ word: 'Guten Morgen', article: '', plural: '', meaning: '早安', englishMeaning: 'Good morning', level: 'A1', type: 'interjection', conjugation: '', example: 'Guten Morgen, Frau Müller!', exampleMeaning: '早安，穆勒太太！' },
{ word: 'Guten Tag', article: '', plural: '', meaning: '日安', englishMeaning: 'Good day', level: 'A1', type: 'interjection', conjugation: '', example: 'Guten Tag, wie kann ich Ihnen helfen?', exampleMeaning: '日安，我能如何幫助您？' },
{ word: 'Guten Abend', article: '', plural: '', meaning: '晚安 (打招呼)', englishMeaning: 'Good evening', level: 'A1', type: 'interjection', conjugation: '', example: 'Guten Abend zusammen.', exampleMeaning: '大家晚安。' },
{ word: 'Gute Nacht', article: '', plural: '', meaning: '晚安 (道別)', englishMeaning: 'Good night', level: 'A1', type: 'interjection', conjugation: '', example: 'Schlaf gut! Gute Nacht.', exampleMeaning: '好好睡！晚安。' },
{ word: 'Auf Wiedersehen', article: '', plural: '', meaning: '再見 (正式)', englishMeaning: 'Goodbye', level: 'A1', type: 'interjection', conjugation: '', example: 'Auf Wiedersehen, bis zum nächsten Mal.', exampleMeaning: '再見，下次見。' },
{ word: 'Name', article: 'der', plural: '-n', meaning: '名字', englishMeaning: 'name', level: 'A1', type: 'noun', conjugation: '', example: 'Mein Name ist Anna.', exampleMeaning: '我的名字是安娜。' },
{ word: 'Land', article: 'das', plural: 'Länder', meaning: '國家', englishMeaning: 'country', level: 'A1', type: 'noun', conjugation: '', example: 'Deutschland ist ein schönes Land.', exampleMeaning: '德國是一個美麗的國家。' },
{ word: 'Stadt', article: 'die', plural: 'Städte', meaning: '城市', englishMeaning: 'city', level: 'A1', type: 'noun', conjugation: '', example: 'Welche Stadt ist das?', exampleMeaning: '這是哪個城市？' },
{ word: 'Haus', article: 'das', plural: 'Häuser', meaning: '房子', englishMeaning: 'house', level: 'A1', type: 'noun', conjugation: '', example: 'Das ist mein Elternhaus.', exampleMeaning: '這是我的老家。' },
{ word: 'Wohnung', article: 'die', plural: '-en', meaning: '公寓', englishMeaning: 'apartment', level: 'A1', type: 'noun', conjugation: '', example: 'Sie sucht eine neue Wohnung.', exampleMeaning: '她在找一間新公寓。' },
{ word: 'Straße', article: 'die', plural: '-n', meaning: '街道', englishMeaning: 'street', level: 'A1', type: 'noun', conjugation: '', example: 'In welcher Straße wohnst du?', exampleMeaning: '你住在哪條街？' },
{ word: 'Zimmer', article: 'das', plural: '-', meaning: '房間', englishMeaning: 'room', level: 'A1', type: 'noun', conjugation: '', example: 'Das Wohnzimmer ist groß.', exampleMeaning: '客廳很大。' },
{ word: 'Familie', article: 'die', plural: '-n', meaning: '家庭', englishMeaning: 'family', level: 'A1', type: 'noun', conjugation: '', example: 'Ich besuche meine Familie.', exampleMeaning: '我拜訪我的家人。' },
{ word: 'Eltern', article: 'die (Pl.)', plural: '-', meaning: '父母', englishMeaning: 'parents', level: 'A1', type: 'noun', conjugation: '', example: 'Meine Eltern leben in Taiwan.', exampleMeaning: '我的父母住在台灣。' },
{ word: 'Geschwister', article: 'die (Pl.)', plural: '-', meaning: '兄弟姊妹', englishMeaning: 'siblings', level: 'A1', type: 'noun', conjugation: '', example: 'Hast du Geschwister?', exampleMeaning: '你有兄弟姊妹嗎？' },
{ word: 'Bruder', article: 'der', plural: 'Brüder', meaning: '兄弟', englishMeaning: 'brother', level: 'A1', type: 'noun', conjugation: '', example: 'Mein Bruder ist älter als ich.', exampleMeaning: '我的哥哥比我大。' },
{ word: 'Schwester', article: 'die', plural: '-n', meaning: '姊妹', englishMeaning: 'sister', level: 'A1', type: 'noun', conjugation: '', example: 'Sie hat zwei Schwestern.', exampleMeaning: '她有兩個姊姊/妹妹。' },
{ word: 'Mann', article: 'der', plural: 'Männer', meaning: '男人；丈夫', englishMeaning: 'man; husband', level: 'A1', type: 'noun', conjugation: '', example: 'Das ist mein Mann.', exampleMeaning: '這是我的丈夫。' },
{ word: 'Frau', article: 'die', plural: '-en', meaning: '女人；妻子', englishMeaning: 'woman; wife', level: 'A1', type: 'noun', conjugation: '', example: 'Sie ist eine nette Frau.', exampleMeaning: '她是一位和藹的女士。' },
{ word: 'Kind', article: 'das', plural: '-er', meaning: '小孩', englishMeaning: 'child', level: 'A1', type: 'noun', conjugation: '', example: 'Die Kinder spielen im Garten.', exampleMeaning: '孩子們在花園裡玩。' },
{ word: 'Freund', article: 'der', plural: '-e', meaning: '朋友 (男)', englishMeaning: 'friend (male)', level: 'A1', type: 'noun', conjugation: '', example: 'Er ist mein bester Freund.', exampleMeaning: '他是我最好的朋友。' },
{ word: 'Freundin', article: 'die', plural: '-nen', meaning: '朋友 (女)', englishMeaning: 'friend (female)', level: 'A1', type: 'noun', conjugation: '', example: 'Das ist meine neue Freundin.', exampleMeaning: '這是我的新朋友。' },
{ word: 'Arbeit', article: 'die', plural: '-en', meaning: '工作', englishMeaning: 'work', level: 'A1', type: 'noun', conjugation: '', example: 'Ich suche eine neue Arbeit.', exampleMeaning: '我在找一份新工作。' },
{ word: 'Beruf', article: 'der', plural: '-e', meaning: '職業', englishMeaning: 'profession', level: 'A1', type: 'noun', conjugation: '', example: 'Was ist Ihr Beruf?', exampleMeaning: '您的職業是什麼？' },
{ word: 'Arzt', article: 'der', plural: 'Ärzte', meaning: '醫生 (男)', englishMeaning: 'doctor (male)', level: 'A1', type: 'noun', conjugation: '', example: 'Ich muss zum Arzt gehen.', exampleMeaning: '我必須去看醫生。' },
{ word: 'Ärztin', article: 'die', plural: '-nen', meaning: '醫生 (女)', englishMeaning: 'doctor (female)', level: 'A1', type: 'noun', conjugation: '', example: 'Meine Ärztin ist sehr nett.', exampleMeaning: '我的女醫生人很好。' },
{ word: 'Lehrer', article: 'der', plural: '-', meaning: '老師 (男)', englishMeaning: 'teacher (male)', level: 'A1', type: 'noun', conjugation: '', example: 'Der Lehrer erklärt die Grammatik.', exampleMeaning: '這位男老師正在解釋文法。' },
{ word: 'Lehrerin', article: 'die', plural: '-nen', meaning: '老師 (女)', englishMeaning: 'teacher (female)', level: 'A1', type: 'noun', conjugation: '', example: 'Sie ist meine Deutschlehrerin.', exampleMeaning: '她是我的德語女老師。' },
{ word: 'Student', article: 'der', plural: '-en', meaning: '學生 (男)', englishMeaning: 'student (male)', level: 'A1', type: 'noun', conjugation: '', example: 'Er ist Student an der Uni.', exampleMeaning: '他是大學生。' },
{ word: 'Studentin', article: 'die', plural: '-nen', meaning: '學生 (女)', englishMeaning: 'student (female)', level: 'A1', type: 'noun', conjugation: '', example: 'Ich bin Studentin in München.', exampleMeaning: '我是慕尼黑的女學生。' },
{ word: 'Auto', article: 'das', plural: '-s', meaning: '汽車', englishMeaning: 'car', level: 'A1', type: 'noun', conjugation: '', example: 'Ich fahre mit dem Auto zur Arbeit.', exampleMeaning: '我開車去上班。' },
{ word: 'Bus', article: 'der', plural: '-se', meaning: '公車', englishMeaning: 'bus', level: 'A1', type: 'noun', conjugation: '', example: 'Der Bus kommt in 10 Minuten.', exampleMeaning: '公車在十分鐘後會來。' },
{ word: 'Zug', article: 'der', plural: 'Züge', meaning: '火車', englishMeaning: 'train', level: 'A1', type: 'noun', conjugation: '', example: 'Der Zug fährt nach Hamburg.', exampleMeaning: '這列火車開往漢堡。' },
{ word: 'Fahrrad', article: 'das', plural: 'Fahrräder', meaning: '腳踏車', englishMeaning: 'bicycle', level: 'A1', type: 'noun', conjugation: '', example: 'Wir fahren mit dem Fahrrad in die Stadt.', exampleMeaning: '我們騎腳踏車進城。' },
{ word: 'Ticket', article: 'das', plural: '-s', meaning: '票', englishMeaning: 'ticket', level: 'A1', type: 'noun', conjugation: '', example: 'Ich brauche ein Ticket.', exampleMeaning: '我需要一張票。' },
{ word: 'Geld', article: 'das', plural: '', meaning: '錢', englishMeaning: 'money', level: 'A1', type: 'noun', conjugation: '', example: 'Hast du genug Geld?', exampleMeaning: '你有足夠的錢嗎？' },
{ word: 'Euro', article: 'der', plural: '-', meaning: '歐元', englishMeaning: 'Euro', level: 'A1', type: 'noun', conjugation: '', example: 'Das kostet fünf Euro.', exampleMeaning: '這要五歐元。' },
{ word: 'Einkauf', article: 'der', plural: 'Einkäufe', meaning: '購物', englishMeaning: 'shopping', level: 'A1', type: 'noun', conjugation: '', example: 'Ich gehe Einkäufe machen.', exampleMeaning: '我要去購物。' },
{ word: 'Supermarkt', article: 'der', plural: '-märkte', meaning: '超市', englishMeaning: 'supermarket', level: 'A1', type: 'noun', conjugation: '', example: 'Der Supermarkt ist gleich um die Ecke.', exampleMeaning: '超市就在街角。' },
{ word: 'Brot', article: 'das', plural: '-e', meaning: '麵包', englishMeaning: 'bread', level: 'A1', type: 'noun', conjugation: '', example: 'Ich möchte ein Stück Brot.', exampleMeaning: '我想要一塊麵包。' },
{ word: 'Wasser', article: 'das', plural: '', meaning: '水', englishMeaning: 'water', level: 'A1', type: 'noun', conjugation: '', example: 'Bitte ein Glas Wasser.', exampleMeaning: '請給我一杯水。' },
{ word: 'Kaffee', article: 'der', plural: '-s', meaning: '咖啡', englishMeaning: 'coffee', level: 'A1', type: 'noun', conjugation: '', example: 'Möchtest du Kaffee trinken?', exampleMeaning: '你想喝咖啡嗎？' },
{ word: 'Tee', article: 'der', plural: '-s', meaning: '茶', englishMeaning: 'tea', level: 'A1', type: 'noun', conjugation: '', example: 'Ich trinke gerne grünen Tee.', exampleMeaning: '我喜歡喝綠茶。' },
{ word: 'Milch', article: 'die', plural: '', meaning: '牛奶', englishMeaning: 'milk', level: 'A1', type: 'noun', conjugation: '', example: 'Brauchst du Milch für den Kaffee?', exampleMeaning: '你的咖啡需要牛奶嗎？' },
{ word: 'Apfel', article: 'der', plural: 'Äpfel', meaning: '蘋果', englishMeaning: 'apple', level: 'A1', type: 'noun', conjugation: '', example: 'Ich esse jeden Tag einen Apfel.', exampleMeaning: '我每天吃一個蘋果。' },
{ word: 'Banane', article: 'die', plural: '-n', meaning: '香蕉', englishMeaning: 'banana', level: 'A1', type: 'noun', conjugation: '', example: 'Die Banane schmeckt süß.', exampleMeaning: '這香蕉嚐起來很甜。' },
{ word: 'Restaurant', article: 'das', plural: '-s', meaning: '餐廳', englishMeaning: 'restaurant', level: 'A1', type: 'noun', conjugation: '', example: 'Wir essen heute Abend im Restaurant.', exampleMeaning: '我們今晚在餐廳吃飯。' },
{ word: 'Rechnung', article: 'die', plural: '-en', meaning: '帳單', englishMeaning: 'bill', level: 'A1', type: 'noun', conjugation: '', example: 'Die Rechnung, bitte.', exampleMeaning: '麻煩給我帳單。' },
{ word: 'Tag', article: 'der', plural: '-e', meaning: '天；白天', englishMeaning: 'day', level: 'A1', type: 'noun', conjugation: '', example: 'Heute ist ein schöner Tag.', exampleMeaning: '今天是一個美好的日子。' },
{ word: 'Woche', article: 'die', plural: '-n', meaning: '週', englishMeaning: 'week', level: 'A1', type: 'noun', conjugation: '', example: 'Nächste Woche habe ich Urlaub.', exampleMeaning: '下週我放假。' },
{ word: 'Monat', article: 'der', plural: '-e', meaning: '月', englishMeaning: 'month', level: 'A1', type: 'noun', conjugation: '', example: 'Der Monat hat vier Wochen.', exampleMeaning: '這個月有四週。' },
{ word: 'Jahr', article: 'das', plural: '-e', meaning: '年', englishMeaning: 'year', level: 'A1', type: 'noun', conjugation: '', example: 'Ein Jahr hat zwölf Monate.', exampleMeaning: '一年有十二個月。' },
{ word: 'Uhr', article: 'die', plural: '-en', meaning: '時鐘；...點', englishMeaning: 'clock; o clock', level: 'A1', type: 'noun', conjugation: '', example: 'Es ist drei Uhr.', exampleMeaning: '現在是三點。' },
{ word: 'Minute', article: 'die', plural: '-n', meaning: '分鐘', englishMeaning: 'minute', level: 'A1', type: 'noun', conjugation: '', example: 'Warte bitte fünf Minuten.', exampleMeaning: '請等五分鐘。' },
{ word: 'heute', article: '', plural: '', meaning: '今天', englishMeaning: 'today', level: 'A1', type: 'adv', conjugation: '', example: 'Was machen wir heute Abend?', exampleMeaning: '我們今晚要做什麼？' },
{ word: 'gestern', article: '', plural: '', meaning: '昨天', englishMeaning: 'yesterday', level: 'A1', type: 'adv', conjugation: '', example: 'Gestern war ich im Kino.', exampleMeaning: '我昨天去看電影了。' },
{ word: 'morgen', article: '', plural: '', meaning: '明天', englishMeaning: 'tomorrow', level: 'A1', type: 'adv', conjugation: '', example: 'Morgen habe ich einen Termin.', exampleMeaning: '我明天有一個預約。' },
{ word: 'jetzt', article: '', plural: '', meaning: '現在', englishMeaning: 'now', level: 'A1', type: 'adv', conjugation: '', example: 'Ich muss jetzt gehen.', exampleMeaning: '我現在必須走了。' },
{ word: 'immer', article: '', plural: '', meaning: '總是', englishMeaning: 'always', level: 'A1', type: 'adv', conjugation: '', example: 'Sie ist immer freundlich.', exampleMeaning: '她總是很友善。' },
{ word: 'oft', article: '', plural: '', meaning: '經常', englishMeaning: 'often', level: 'A1', type: 'adv', conjugation: '', example: 'Ich lese oft Bücher.', exampleMeaning: '我經常讀書。' },
{ word: 'nie', article: '', plural: '', meaning: '從不', englishMeaning: 'never', level: 'A1', type: 'adv', conjugation: '', example: 'Er kommt nie zu spät.', exampleMeaning: '他從不遲到。' },
{ word: 'groß', article: '', plural: '', meaning: '大的；高的', englishMeaning: 'big; tall', level: 'A1', type: 'adj', conjugation: '', example: 'Das Haus ist sehr groß.', exampleMeaning: '這間房子非常大。' },
{ word: 'klein', article: '', plural: '', meaning: '小的', englishMeaning: 'small', level: 'A1', type: 'adj', conjugation: '', example: 'Ich habe eine kleine Wohnung.', exampleMeaning: '我有一間小公寓。' },
{ word: 'alt', article: '', plural: '', meaning: '老的；舊的', englishMeaning: 'old', level: 'A1', type: 'adj', conjugation: '', example: 'Wie alt sind Sie?', exampleMeaning: '您幾歲了？' },
{ word: 'neu', article: '', plural: '', meaning: '新的', englishMeaning: 'new', level: 'A1', type: 'adj', conjugation: '', example: 'Das ist mein neues Handy.', exampleMeaning: '這是我的新手機。' },
{ word: 'gut', article: '', plural: '', meaning: '好的', englishMeaning: 'good', level: 'A1', type: 'adj', conjugation: '', example: 'Das Essen schmeckt gut.', exampleMeaning: '這食物味道不錯。' },
{ word: 'schlecht', article: '', plural: '', meaning: '壞的', englishMeaning: 'bad', level: 'A1', type: 'adj', conjugation: '', example: 'Das Wetter ist heute schlecht.', exampleMeaning: '今天天氣很差。' },
{ word: 'schön', article: '', plural: '', meaning: '美麗的；好的', englishMeaning: 'beautiful; nice', level: 'A1', type: 'adj', conjugation: '', example: 'Du hast ein schönes Kleid.', exampleMeaning: '你有一件漂亮的洋裝。' },
{ word: 'nett', article: '', plural: '', meaning: '和藹的；友善的', englishMeaning: 'nice; kind', level: 'A1', type: 'adj', conjugation: '', example: 'Meine Nachbarn sind sehr nett.', exampleMeaning: '我的鄰居非常友善。' },
{ word: 'teuer', article: '', plural: '', meaning: '貴的', englishMeaning: 'expensive', level: 'A1', type: 'adj', conjugation: '', example: 'Das Auto ist zu teuer.', exampleMeaning: '這輛車太貴了。' },
{ word: 'billig', article: '', plural: '', meaning: '便宜的', englishMeaning: 'cheap', level: 'A1', type: 'adj', conjugation: '', example: 'Ich suche ein billiges Ticket.', exampleMeaning: '我在找一張便宜的票。' },
{ word: 'langsam', article: '', plural: '', meaning: '慢的', englishMeaning: 'slow', level: 'A1', type: 'adj', conjugation: '', example: 'Bitte sprechen Sie langsam!', exampleMeaning: '請您說慢一點！' },
{ word: 'schnell', article: '', plural: '', meaning: '快的', englishMeaning: 'fast', level: 'A1', type: 'adj', conjugation: '', example: 'Er fährt zu schnell.', exampleMeaning: '他開得太快了。' },
{ word: 'leicht', article: '', plural: '', meaning: '容易的；輕的', englishMeaning: 'easy; light', level: 'A1', type: 'adj', conjugation: '', example: 'Die Prüfung ist leicht.', exampleMeaning: '這個考試很簡單。' },
{ word: 'schwer', article: '', plural: '', meaning: '困難的；重的', englishMeaning: 'difficult; heavy', level: 'A1', type: 'adj', conjugation: '', example: 'Die Tasche ist sehr schwer.', exampleMeaning: '這個包包很重。' },
{ word: 'gern', article: '', plural: '', meaning: '喜歡地', englishMeaning: 'gladly; like to', level: 'A1', type: 'adv', conjugation: '', example: 'Ich esse gern Pizza.', exampleMeaning: '我喜歡吃披薩。' },
{ word: 'nicht', article: '', plural: '', meaning: '不', englishMeaning: 'not', level: 'A1', type: 'adv', conjugation: '', example: 'Das ist nicht richtig.', exampleMeaning: '這是不對的。' },
{ word: 'sehr', article: '', plural: '', meaning: '非常', englishMeaning: 'very', level: 'A1', type: 'adv', conjugation: '', example: 'Es ist heute sehr kalt.', exampleMeaning: '今天非常冷。' },
{ word: 'auch', article: '', plural: '', meaning: '也', englishMeaning: 'also', level: 'A1', type: 'adv', conjugation: '', example: 'Ich komme auch.', exampleMeaning: '我也來。' },
{ word: 'vielleicht', article: '', plural: '', meaning: '也許', englishMeaning: 'maybe', level: 'A1', type: 'adv', conjugation: '', example: 'Vielleicht regnet es morgen.', exampleMeaning: '或許明天下雨。' },
{ word: 'und', article: '', plural: '', meaning: '和', englishMeaning: 'and', level: 'A1', type: 'conj', conjugation: '', example: 'Kaffee und Kuchen.', exampleMeaning: '咖啡和蛋糕。' },
{ word: 'aber', article: '', plural: '', meaning: '但是', englishMeaning: 'but', level: 'A1', type: 'conj', conjugation: '', example: 'Es ist schön, aber kalt.', exampleMeaning: '很美，但是很冷。' },
{ word: 'oder', article: '', plural: '', meaning: '或者', englishMeaning: 'or', level: 'A1', type: 'conj', conjugation: '', example: 'Tee oder Kaffee?', exampleMeaning: '茶還是咖啡？' },
{ word: 'denn', article: '', plural: '', meaning: '因為', englishMeaning: 'because (main clause)', level: 'A1', type: 'conj', conjugation: '', example: 'Ich bin müde, denn ich habe viel gearbeitet.', exampleMeaning: '我很累，因為我工作了很多。' },
{ word: 'mit', article: '', plural: '', meaning: '與...一起；搭乘', englishMeaning: 'with; by (transport)', level: 'A1', type: 'prep', conjugation: '', example: 'Ich fahre mit dem Zug.', exampleMeaning: '我搭火車。' },
{ word: 'in', article: '', plural: '', meaning: '在...裡面', englishMeaning: 'in', level: 'A1', type: 'prep', conjugation: '', example: 'Das Buch ist in der Tasche.', exampleMeaning: '這本書在包包裡。' },
{ word: 'nach', article: '', plural: '', meaning: '往...去 (國家/城市)', englishMeaning: 'to (country/city)', level: 'A1', type: 'prep', conjugation: '', example: 'Ich fliege nach Taiwan.', exampleMeaning: '我飛往台灣。' },
{ word: 'aus', article: '', plural: '', meaning: '從...來', englishMeaning: 'from', level: 'A1', type: 'prep', conjugation: '', example: 'Er kommt aus Deutschland.', exampleMeaning: '他來自德國。' },
{ word: 'von', article: '', plural: '', meaning: '從...；屬於', englishMeaning: 'from; of', level: 'A1', type: 'prep', conjugation: '', example: 'Das Buch ist von mir.', exampleMeaning: '這本書是我的。' },
{ word: 'zu', article: '', plural: '', meaning: '去... (人/地方)', englishMeaning: 'to (person/location)', level: 'A1', type: 'prep', conjugation: '', example: 'Ich gehe zum Arzt.', exampleMeaning: '我去看醫生。' },
{ word: 'über', article: '', plural: '', meaning: '在...之上；關於', englishMeaning: 'over; about', level: 'A1', type: 'prep', conjugation: '', example: 'Wir reden über das Wetter.', exampleMeaning: '我們在談論天氣。' },
{ word: 'an', article: '', plural: '', meaning: '在...旁邊；在...上', englishMeaning: 'at; on (vertical surface)', level: 'A1', type: 'prep', conjugation: '', example: 'Das Bild hängt an der Wand.', exampleMeaning: '這幅畫掛在牆上。' },
{ word: 'auf', article: '', plural: '', meaning: '在...上面 (平面)', englishMeaning: 'on (horizontal surface)', level: 'A1', type: 'prep', conjugation: '', example: 'Die Tasse steht auf dem Tisch.', exampleMeaning: '杯子放在桌子上。' },
{ word: 'unter', article: '', plural: '', meaning: '在...下面', englishMeaning: 'under', level: 'A1', type: 'prep', conjugation: '', example: 'Die Katze ist unter dem Bett.', exampleMeaning: '貓在床底下。' },
{ word: 'neben', article: '', plural: '', meaning: '在...旁邊', englishMeaning: 'next to', level: 'A1', type: 'prep', conjugation: '', example: 'Das Restaurant ist neben der Post.', exampleMeaning: '餐廳在郵局旁邊。' },
{ word: 'zwischen', article: '', plural: '', meaning: '在...之間', englishMeaning: 'between', level: 'A1', type: 'prep', conjugation: '', example: 'Der Park liegt zwischen zwei Straßen.', exampleMeaning: '公園位於兩條街之間。' },
{ word: 'vor', article: '', plural: '', meaning: '在...前面', englishMeaning: 'in front of; before', level: 'A1', type: 'prep', conjugation: '', example: 'Das Auto steht vor dem Haus.', exampleMeaning: '車子停在房子前面。' },
{ word: 'hinter', article: '', plural: '', meaning: '在...後面', englishMeaning: 'behind', level: 'A1', type: 'prep', conjugation: '', example: 'Der Garten ist hinter dem Haus.', exampleMeaning: '花園在房子後面。' },
{ word: 'Termin', article: 'der', plural: '-e', meaning: '預約；約會', englishMeaning: 'appointment', level: 'A1', type: 'noun', conjugation: '', example: 'Ich habe einen Termin beim Arzt.', exampleMeaning: '我跟醫生有一個預約。' },
{ word: 'Telefon', article: 'das', plural: '-e', meaning: '電話', englishMeaning: 'telephone', level: 'A1', type: 'noun', conjugation: '', example: 'Gib mir bitte deine Telefonnummer.', exampleMeaning: '請給我你的電話號碼。' },
{ word: 'Hobby', article: 'das', plural: '-s', meaning: '嗜好', englishMeaning: 'hobby', level: 'A1', type: 'noun', conjugation: '', example: 'Meine Hobbys sind Lesen und Schwimmen.', exampleMeaning: '我的嗜好是閱讀和游泳。' },
{ word: 'Musik', article: 'die', plural: '', meaning: '音樂', englishMeaning: 'music', level: 'A1', type: 'noun', conjugation: '', example: 'Ich höre gern Musik.', exampleMeaning: '我喜歡聽音樂。' },
{ word: 'Sport', article: 'der', plural: '', meaning: '運動', englishMeaning: 'sport', level: 'A1', type: 'noun', conjugation: '', example: 'Treibst du viel Sport?', exampleMeaning: '你常做運動嗎？' },
{ word: 'Foto', article: 'das', plural: '-s', meaning: '照片', englishMeaning: 'photo', level: 'A1', type: 'noun', conjugation: '', example: 'Ich mache viele Fotos im Urlaub.', exampleMeaning: '我在度假時拍了很多照片。' },
{ word: 'Buch', article: 'das', plural: 'Bücher', meaning: '書', englishMeaning: 'book', level: 'A1', type: 'noun', conjugation: '', example: 'Das Buch ist sehr interessant.', exampleMeaning: '這本書非常有趣。' },
{ word: 'Brief', article: 'der', plural: '-e', meaning: '信', englishMeaning: 'letter', level: 'A1', type: 'noun', conjugation: '', example: 'Hast du einen Brief für mich?', exampleMeaning: '你有我的信嗎？' },
{ word: 'Zahl', article: 'die', plural: '-en', meaning: '數字', englishMeaning: 'number', level: 'A1', type: 'noun', conjugation: '', example: 'Schreiben Sie die Zahl auf.', exampleMeaning: '請寫下這個數字。' },
{ word: 'Frage', article: 'die', plural: '-n', meaning: '問題', englishMeaning: 'question', level: 'A1', type: 'noun', conjugation: '', example: 'Ich habe noch eine Frage.', exampleMeaning: '我還有一個問題。' },
{ word: 'Antwort', article: 'die', plural: '-en', meaning: '回答', englishMeaning: 'answer', level: 'A1', type: 'noun', conjugation: '', example: 'Die Antwort ist falsch.', exampleMeaning: '這個答案是錯的。' },
{ word: 'Tür', article: 'die', plural: '-en', meaning: '門', englishMeaning: 'door', level: 'A1', type: 'noun', conjugation: '', example: 'Mach bitte die Tür zu.', exampleMeaning: '請把門關上。' },
{ word: 'Fenster', article: 'das', plural: '-', meaning: '窗戶', englishMeaning: 'window', level: 'A1', type: 'noun', conjugation: '', example: 'Das Fenster ist offen.', exampleMeaning: '窗戶開著。' },
{ word: 'Tisch', article: 'der', plural: '-e', meaning: '桌子', englishMeaning: 'table', level: 'A1', type: 'noun', conjugation: '', example: 'Wir sitzen am Tisch.', exampleMeaning: '我們坐在桌旁。' },
{ word: 'Stuhl', article: 'der', plural: 'Stühle', meaning: '椅子', englishMeaning: 'chair', level: 'A1', type: 'noun', conjugation: '', example: 'Brauchst du noch einen Stuhl?', exampleMeaning: '你還需要一把椅子嗎？' },
{ word: 'Lampe', article: 'die', plural: '-n', meaning: '燈', englishMeaning: 'lamp', level: 'A1', type: 'noun', conjugation: '', example: 'Die Lampe ist kaputt.', exampleMeaning: '燈壞了。' },
{ word: 'Küche', article: 'die', plural: '-n', meaning: '廚房', englishMeaning: 'kitchen', level: 'A1', type: 'noun', conjugation: '', example: 'Die Küche ist modern.', exampleMeaning: '這個廚房很現代。' },
{ word: 'Bad', article: 'das', plural: 'Bäder', meaning: '浴室', englishMeaning: 'bathroom', level: 'A1', type: 'noun', conjugation: '', example: 'Wo ist das Bad?', exampleMeaning: '浴室在哪裡？' },
{ word: 'Bett', article: 'das', plural: '-en', meaning: '床', englishMeaning: 'bed', level: 'A1', type: 'noun', conjugation: '', example: 'Ich gehe ins Bett.', exampleMeaning: '我要去睡覺了。' },
{ word: 'Frühstück', article: 'das', plural: '-e', meaning: '早餐', englishMeaning: 'breakfast', level: 'A1', type: 'noun', conjugation: '', example: 'Das Frühstück ist fertig.', exampleMeaning: '早餐準備好了。' },
{ word: 'Mittagessen', article: 'das', plural: '-', meaning: '午餐', englishMeaning: 'lunch', level: 'A1', type: 'noun', conjugation: '', example: 'Was gibt es zum Mittagessen?', exampleMeaning: '午餐有什麼？' },
{ word: 'Abendessen', article: 'das', plural: '-', meaning: '晚餐', englishMeaning: 'dinner', level: 'A1', type: 'noun', conjugation: '', example: 'Wir essen um 19 Uhr zu Abend.', exampleMeaning: '我們晚上七點吃晚餐。' },
{ word: 'Gemüse', article: 'das', plural: '-', meaning: '蔬菜', englishMeaning: 'vegetables', level: 'A1', type: 'noun', conjugation: '', example: 'Ich esse viel Gemüse.', exampleMeaning: '我吃很多蔬菜。' },
{ word: 'Obst', article: 'das', plural: '', meaning: '水果', englishMeaning: 'fruit', level: 'A1', type: 'noun', conjugation: '', example: 'Obst ist gesund.', exampleMeaning: '水果很健康。' },
{ word: 'Fleisch', article: 'das', plural: '', meaning: '肉', englishMeaning: 'meat', level: 'A1', type: 'noun', conjugation: '', example: 'Isst du gern Fleisch?', exampleMeaning: '你喜歡吃肉嗎？' },
{ word: 'Fisch', article: 'der', plural: '-e', meaning: '魚', englishMeaning: 'fish', level: 'A1', type: 'noun', conjugation: '', example: 'Ich bestelle Fisch.', exampleMeaning: '我點魚。' },
{ word: 'Käse', article: 'der', plural: '-', meaning: '起司', englishMeaning: 'cheese', level: 'A1', type: 'noun', conjugation: '', example: 'Ich mag Käse auf dem Brot.', exampleMeaning: '我喜歡麵包上放起司。' },
{ word: 'Ei', article: 'das', plural: 'Eier', meaning: '蛋', englishMeaning: 'egg', level: 'A1', type: 'noun', conjugation: '', example: 'Ich esse zwei Eier zum Frühstück.', exampleMeaning: '我早餐吃兩個蛋。' },
{ word: 'Saft', article: 'der', plural: 'Säfte', meaning: '果汁', englishMeaning: 'juice', level: 'A1', type: 'noun', conjugation: '', example: 'Möchtest du Orangensaft?', exampleMeaning: '你想要柳橙汁嗎？' },
{ word: 'Wein', article: 'der', plural: '-e', meaning: '酒', englishMeaning: 'wine', level: 'A1', type: 'noun', conjugation: '', example: 'Ich trinke gerne Rotwein.', exampleMeaning: '我喜歡喝紅酒。' },
{ word: 'Bier', article: 'das', plural: '-e', meaning: '啤酒', englishMeaning: 'beer', level: 'A1', type: 'noun', conjugation: '', example: 'Ein Bier, bitte.', exampleMeaning: '請給我一杯啤酒。' },
{ word: 'Wetter', article: 'das', plural: '', meaning: '天氣', englishMeaning: 'weather', level: 'A1', type: 'noun', conjugation: '', example: 'Das Wetter ist heute sonnig.', exampleMeaning: '今天天氣晴朗。' },
{ word: 'Sonne', article: 'die', plural: '', meaning: '太陽', englishMeaning: 'sun', level: 'A1', type: 'noun', conjugation: '', example: 'Die Sonne scheint.', exampleMeaning: '陽光普照。' },
{ word: 'Regen', article: 'der', plural: '', meaning: '雨', englishMeaning: 'rain', level: 'A1', type: 'noun', conjugation: '', example: 'Es regnet den ganzen Tag.', exampleMeaning: '下了一整天的雨。' },
{ word: 'Wind', article: 'der', plural: '-e', meaning: '風', englishMeaning: 'wind', level: 'A1', type: 'noun', conjugation: '', example: 'Der Wind ist sehr stark.', exampleMeaning: '風非常大。' },
{ word: 'Schnee', article: 'der', plural: '', meaning: '雪', englishMeaning: 'snow', level: 'A1', type: 'noun', conjugation: '', example: 'Es schneit im Winter.', exampleMeaning: '冬天會下雪。' },
{ word: 'warm', article: '', plural: '', meaning: '溫暖的', englishMeaning: 'warm', level: 'A1', type: 'adj', conjugation: '', example: 'Heute ist es warm.', exampleMeaning: '今天很溫暖。' },
{ word: 'kalt', article: '', plural: '', meaning: '冷的', englishMeaning: 'cold', level: 'A1', type: 'adj', conjugation: '', example: 'Mir ist kalt.', exampleMeaning: '我覺得冷。' },
{ word: 'heiß', article: '', plural: '', meaning: '熱的', englishMeaning: 'hot', level: 'A1', type: 'adj', conjugation: '', example: 'Der Kaffee ist sehr heiß.', exampleMeaning: '這咖啡非常熱。' },
{ word: 'sonnig', article: '', plural: '', meaning: '晴朗的', englishMeaning: 'sunny', level: 'A1', type: 'adj', conjugation: '', example: 'Morgen wird es sonnig.', exampleMeaning: '明天會是晴天。' },
{ word: 'regnen', article: '', plural: '', meaning: '下雨', englishMeaning: 'to rain', level: 'A1', type: 'verb', conjugation: 'es regnet, regnete, hat geregnet', example: 'Es hat gestern geregnet.', exampleMeaning: '昨天有下雨。' },
{ word: 'scheinen', article: '', plural: '', meaning: '照耀', englishMeaning: 'to shine', level: 'A1', type: 'verb', conjugation: 'er scheint, schien, hat geschienen', example: 'Die Sonne scheint hell.', exampleMeaning: '太陽照耀得很亮。' },
{ word: 'Zimmer', article: 'das', plural: '-', meaning: '房間', englishMeaning: 'room', level: 'A1', type: 'noun', conjugation: '', example: 'Das Zimmer ist hell.', exampleMeaning: '這個房間很亮。' },
{ word: 'Bad', article: 'das', plural: 'Bäder', meaning: '浴缸；浴室', englishMeaning: 'bath; bathroom', level: 'A1', type: 'noun', conjugation: '', example: 'Ich gehe ins Bad.', exampleMeaning: '我去浴室。' },
{ word: 'Küche', article: 'die', plural: '-n', meaning: '廚房', englishMeaning: 'kitchen', level: 'A1', type: 'noun', conjugation: '', example: 'Die Küche ist zu klein.', exampleMeaning: '這個廚房太小了。' },
{ word: 'Balkon', article: 'der', plural: '-e', meaning: '陽台', englishMeaning: 'balcony', level: 'A1', type: 'noun', conjugation: '', example: 'Wir frühstücken auf dem Balkon.', exampleMeaning: '我們在陽台上吃早餐。' },
{ word: 'Möbel', article: 'die (Pl.)', plural: '', meaning: '傢俱', englishMeaning: 'furniture', level: 'A1', type: 'noun', conjugation: '', example: 'Ich brauche neue Möbel.', exampleMeaning: '我需要新的傢俱。' },
{ word: 'Schrank', article: 'der', plural: 'Schränke', meaning: '衣櫃；櫥櫃', englishMeaning: 'wardrobe; cupboard', level: 'A1', type: 'noun', conjugation: '', example: 'Die Kleidung ist im Schrank.', exampleMeaning: '衣服在衣櫃裡。' },
{ word: 'Sofa', article: 'das', plural: '-s', meaning: '沙發', englishMeaning: 'sofa', level: 'A1', type: 'noun', conjugation: '', example: 'Ich sitze auf dem Sofa.', exampleMeaning: '我坐在沙發上。' },
{ word: 'Computer', article: 'der', plural: '-', meaning: '電腦', englishMeaning: 'computer', level: 'A1', type: 'noun', conjugation: '', example: 'Der Computer ist sehr schnell.', exampleMeaning: '這台電腦很快。' },
{ word: 'Handy', article: 'das', plural: '-s', meaning: '手機', englishMeaning: 'mobile phone', level: 'A1', type: 'noun', conjugation: '', example: 'Wo ist mein Handy?', exampleMeaning: '我的手機在哪裡？' },
{ word: 'kochen', article: '', plural: '', meaning: '煮飯', englishMeaning: 'to cook', level: 'A1', type: 'verb', conjugation: 'er kocht, kochte, hat gekocht', example: 'Er kocht sehr gut.', exampleMeaning: '他煮飯非常好吃。' },
{ word: 'schlafen', article: '', plural: '', meaning: '睡覺', englishMeaning: 'to sleep', level: 'A1', type: 'verb', conjugation: 'er schläft, schlief, hat geschlafen', example: 'Ich schlafe acht Stunden.', exampleMeaning: '我睡八個小時。' },
{ word: 'aufstehen', article: '', plural: '', meaning: '起床', englishMeaning: 'to get up', level: 'A1', type: 'verb', conjugation: 'er steht auf, stand auf, ist aufgestanden', example: 'Wann stehst du auf?', exampleMeaning: '你什麼時候起床？' },
{ word: 'anrufen', article: '', plural: '', meaning: '打電話', englishMeaning: 'to call (on the phone)', level: 'A1', type: 'verb', conjugation: 'er ruft an, rief an, hat angerufen', example: 'Ich rufe dich später an.', exampleMeaning: '我稍後打電話給你。' },
{ word: 'einkaufen', article: '', plural: '', meaning: '購物', englishMeaning: 'to shop', level: 'A1', type: 'verb', conjugation: 'er kauft ein, kaufte ein, hat eingekauft', example: 'Wir müssen Lebensmittel einkaufen.', exampleMeaning: '我們必須去買雜貨。' },
{ word: 'zurückkommen', article: '', plural: '', meaning: '回來', englishMeaning: 'to come back', level: 'A1', type: 'verb', conjugation: 'er kommt zurück, kam zurück, ist zurückgekommen', example: 'Ich komme morgen zurück.', exampleMeaning: '我明天回來。' },
{ word: 'gernhaben', article: '', plural: '', meaning: '喜歡', englishMeaning: 'to like', level: 'A1', type: 'verb', conjugation: 'er hat gern, hatte gern, hat gerngehabt', example: 'Ich habe dich gern.', exampleMeaning: '我喜歡你。' },
{ word: 'wiederholen', article: '', plural: '', meaning: '重複', englishMeaning: 'to repeat', level: 'A1', type: 'verb', conjugation: 'er wiederholt, wiederholte, hat wiederholt', example: 'Wiederholen Sie bitte den Satz.', exampleMeaning: '請您重複這個句子。' },
{ word: 'üben', article: '', plural: '', meaning: '練習', englishMeaning: 'to practice', level: 'A1', type: 'verb', conjugation: 'er übt, übte, hat geübt', example: 'Wir müssen mehr üben.', exampleMeaning: '我們必須多練習。' },
{ word: 'verstehen', article: '', plural: '', meaning: '理解', englishMeaning: 'to understand', level: 'A1', type: 'verb', conjugation: 'er versteht, verstand, hat verstanden', example: 'Ich verstehe die Frage nicht.', exampleMeaning: '我不懂這個問題。' },
{ word: 'schreiben', article: '', plural: '', meaning: '寫', englishMeaning: 'to write', level: 'A1', type: 'verb', conjugation: 'er schreibt, schrieb, hat geschrieben', example: 'Sie schreibt eine E-Mail.', exampleMeaning: '她在寫一封電子郵件。' },
{ word: 'bezahlen', article: '', plural: '', meaning: '付錢', englishMeaning: 'to pay', level: 'A1', type: 'verb', conjugation: 'er bezahlt, bezahlte, hat bezahlt', example: 'Ich muss die Rechnung bezahlen.', exampleMeaning: '我必須支付帳單。' },
{ word: 'kosten', article: '', plural: '', meaning: '花費', englishMeaning: 'to cost', level: 'A1', type: 'verb', conjugation: 'es kostet, kostete, hat gekostet', example: 'Wie viel kostet das?', exampleMeaning: '這個多少錢？' },
{ word: 'öffnen', article: '', plural: '', meaning: '打開', englishMeaning: 'to open', level: 'A1', type: 'verb', conjugation: 'er öffnet, öffnete, hat geöffnet', example: 'Kannst du das Fenster öffnen?', exampleMeaning: '你可以打開窗戶嗎？' },
{ word: 'schließen', article: '', plural: '', meaning: '關閉', englishMeaning: 'to close', level: 'A1', type: 'verb', conjugation: 'er schließt, schloss, hat geschlossen', example: 'Der Laden schließt um 20 Uhr.', exampleMeaning: '商店晚上八點關門。' },
{ word: 'helfen', article: '', plural: '', meaning: '幫忙', englishMeaning: 'to help', level: 'A1', type: 'verb', conjugation: 'er hilft, half, hat geholfen', example: 'Kann ich Ihnen helfen?', exampleMeaning: '我可以幫您嗎？' },
{ word: 'suchen', article: '', plural: '', meaning: '尋找', englishMeaning: 'to search', level: 'A1', type: 'verb', conjugation: 'er sucht, suchte, hat gesucht', example: 'Ich suche meine Schlüssel.', exampleMeaning: '我在找我的鑰匙。' },
{ word: 'finden', article: '', plural: '', meaning: '找到', englishMeaning: 'to find', level: 'A1', type: 'verb', conjugation: 'er findet, fand, hat gefunden', example: 'Endlich habe ich ihn gefunden.', exampleMeaning: '我終於找到它了。' },
{ word: 'wissen', article: '', plural: '', meaning: '知道', englishMeaning: 'to know (facts)', level: 'A1', type: 'verb', conjugation: 'er weiß, wusste, hat gewusst', example: 'Ich weiß es nicht.', exampleMeaning: '我不知道。' },
{ word: 'kennen', article: '', plural: '', meaning: '認識 (人/地)', englishMeaning: 'to know (person/place)', level: 'A1', type: 'verb', conjugation: 'er kennt, kannte, hat gekannt', example: 'Kennen Sie diesen Ort?', exampleMeaning: '您認識這個地方嗎？' },
{ word: 'geben', article: '', plural: '', meaning: '給予', englishMeaning: 'to give', level: 'A1', type: 'verb', conjugation: 'er gibt, gab, hat gegeben', example: 'Gib mir bitte das Salz.', exampleMeaning: '請把鹽給我。' },
{ word: 'nehmen', article: '', plural: '', meaning: '拿；取', englishMeaning: 'to take', level: 'A1', type: 'verb', conjugation: 'er nimmt, nahm, hat genommen', example: 'Nimmst du Zucker in den Tee?', exampleMeaning: '你的茶要加糖嗎？' },
{ word: 'dauern', article: '', plural: '', meaning: '持續', englishMeaning: 'to last', level: 'A1', type: 'verb', conjugation: 'es dauert, dauerte, hat gedauert', example: 'Wie lange dauert der Flug?', exampleMeaning: '這個航班持續多久？' },
{ word: 'brauchen', article: '', plural: '', meaning: '需要', englishMeaning: 'to need', level: 'A1', type: 'verb', conjugation: 'er braucht, brauchte, hat gebraucht', example: 'Ich brauche eine Pause.', exampleMeaning: '我需要休息一下。' },
{ word: 'zeigen', article: '', plural: '', meaning: '展示', englishMeaning: 'to show', level: 'A1', type: 'verb', conjugation: 'er zeigt, zeigte, hat gezeigt', example: 'Kannst du mir den Weg zeigen?', exampleMeaning: '你能告訴我路怎麼走嗎？' },
{ word: 'hören', article: '', plural: '', meaning: '聽', englishMeaning: 'to hear', level: 'A1', type: 'verb', conjugation: 'er hört, hörte, hat gehört', example: 'Hörst du die Musik?', exampleMeaning: '你聽到音樂了嗎？' },
{ word: 'spielen', article: '', plural: '', meaning: '玩；演奏', englishMeaning: 'to play', level: 'A1', type: 'verb', conjugation: 'er spielt, spielte, hat gespielt', example: 'Die Kinder spielen Fußball.', exampleMeaning: '孩子們在踢足球。' },
{ word: 'sprechen', article: '', plural: '', meaning: '說', englishMeaning: 'to speak', level: 'A1', type: 'verb', conjugation: 'er spricht, sprach, hat gesprochen', example: 'Wir sprechen über die Pläne.', exampleMeaning: '我們在談論計畫。' },
{ word: 'wo', article: '', plural: '', meaning: '在哪裡', englishMeaning: 'where', level: 'A1', type: 'adv', conjugation: '', example: 'Wo wohnst du?', exampleMeaning: '你住在哪裡？' },
{ word: 'woher', article: '', plural: '', meaning: '從哪裡', englishMeaning: 'where from', level: 'A1', type: 'adv', conjugation: '', example: 'Woher kommen Sie?', exampleMeaning: '您從哪裡來？' },
{ word: 'wohin', article: '', plural: '', meaning: '往哪裡', englishMeaning: 'where to', level: 'A1', type: 'adv', conjugation: '', example: 'Wohin fährt der Zug?', exampleMeaning: '這火車開往哪裡？' },
{ word: 'wann', article: '', plural: '', meaning: '什麼時候', englishMeaning: 'when', level: 'A1', type: 'adv', conjugation: '', example: 'Wann beginnt der Film?', exampleMeaning: '電影什麼時候開始？' },
{ word: 'warum', article: '', plural: '', meaning: '為什麼', englishMeaning: 'why', level: 'A1', type: 'adv', conjugation: '', example: 'Warum lernst du Deutsch?', exampleMeaning: '你為什麼學德語？' },
{ word: 'wie', article: '', plural: '', meaning: '如何；怎樣', englishMeaning: 'how', level: 'A1', type: 'adv', conjugation: '', example: 'Wie geht es Ihnen?', exampleMeaning: '您好嗎？' },
{ word: 'was', article: '', plural: '', meaning: '什麼', englishMeaning: 'what', level: 'A1', type: 'pronoun', conjugation: '', example: 'Was möchten Sie trinken?', exampleMeaning: '您想喝點什麼？' },
{ word: 'wer', article: '', plural: '', meaning: '誰', englishMeaning: 'who', level: 'A1', type: 'pronoun', conjugation: '', example: 'Wer ist das?', exampleMeaning: '那是誰？' },
{ word: 'wem', article: '', plural: '', meaning: '給誰 (Dativ)', englishMeaning: 'to whom (Dativ)', level: 'A1', type: 'pronoun', conjugation: '', example: 'Wem gehört dieses Buch?', exampleMeaning: '這本書是誰的？' },
{ word: 'wen', article: '', plural: '', meaning: '誰 (Akkusativ)', englishMeaning: 'whom (Akkusativ)', level: 'A1', type: 'pronoun', conjugation: '', example: 'Wen siehst du?', exampleMeaning: '你看到誰？' },
{ word: 'welche', article: '', plural: '', meaning: '哪一個', englishMeaning: 'which', level: 'A1', type: 'pronoun', conjugation: '', example: 'Welches Auto ist deins?', exampleMeaning: '哪輛車是你的？' },
{ word: 'Mann', article: 'der', plural: 'Männer', meaning: '男人；丈夫', englishMeaning: 'man; husband', level: 'A1', type: 'noun', conjugation: '', example: 'Er ist ein guter Mann.', exampleMeaning: '他是一個好男人。' },
{ word: 'Frau', article: 'die', plural: '-en', meaning: '女人；妻子', englishMeaning: 'woman; wife', level: 'A1', type: 'noun', conjugation: '', example: 'Sie ist meine Frau.', exampleMeaning: '她是我的妻子。' },
{ word: 'Kind', article: 'das', plural: '-er', meaning: '小孩', englishMeaning: 'child', level: 'A1', type: 'noun', conjugation: '', example: 'Das Kind spielt draußen.', exampleMeaning: '那個小孩在外面玩。' },
{ word: 'Vater', article: 'der', plural: 'Väter', meaning: '父親', englishMeaning: 'father', level: 'A1', type: 'noun', conjugation: '', example: 'Mein Vater arbeitet als Ingenieur.', exampleMeaning: '我的父親是工程師。' },
{ word: 'Mutter', article: 'die', plural: 'Mütter', meaning: '母親', englishMeaning: 'mother', level: 'A1', type: 'noun', conjugation: '', example: 'Meine Mutter kocht gern.', exampleMeaning: '我的母親喜歡煮飯。' },
{ word: 'Sohn', article: 'der', plural: 'Söhne', meaning: '兒子', englishMeaning: 'son', level: 'A1', type: 'noun', conjugation: '', example: 'Ihr Sohn studiert in Köln.', exampleMeaning: '她的兒子在科隆讀書。' },
{ word: 'Tochter', article: 'die', plural: 'Töchter', meaning: '女兒', englishMeaning: 'daughter', level: 'A1', type: 'noun', conjugation: '', example: 'Unsere Tochter ist drei Jahre alt.', exampleMeaning: '我們的女兒三歲了。' },
{ word: 'Großvater', article: 'der', plural: 'Großväter', meaning: '祖父；外祖父', englishMeaning: 'grandfather', level: 'A1', type: 'noun', conjugation: '', example: 'Mein Großvater ist 80.', exampleMeaning: '我的祖父八十歲了。' },
{ word: 'Großmutter', article: 'die', plural: 'Großmütter', meaning: '祖母；外祖母', englishMeaning: 'grandmother', level: 'A1', type: 'noun', conjugation: '', example: 'Die Großmutter erzählt Geschichten.', exampleMeaning: '祖母講故事。' },
{ word: 'Geschwister', article: 'die (Pl.)', plural: '-', meaning: '兄弟姊妹', englishMeaning: 'siblings', level: 'A1', type: 'noun', conjugation: '', example: 'Ich habe keine Geschwister.', exampleMeaning: '我沒有兄弟姊妹。' },
{ word: 'Adresse', article: 'die', plural: '-n', meaning: '地址', englishMeaning: 'address', level: 'A1', type: 'noun', conjugation: '', example: 'Was ist deine Adresse?', exampleMeaning: '你的地址是什麼？' },
{ word: 'Postleitzahl', article: 'die', plural: '-en', meaning: '郵遞區號', englishMeaning: 'postal code', level: 'A1', type: 'noun', conjugation: '', example: 'Bitte geben Sie die Postleitzahl ein.', exampleMeaning: '請輸入郵遞區號。' },
{ word: 'Telefonnummer', article: 'die', plural: '-n', meaning: '電話號碼', englishMeaning: 'phone number', level: 'A1', type: 'noun', conjugation: '', example: 'Haben Sie meine Telefonnummer?', exampleMeaning: '您有我的電話號碼嗎？' },
{ word: 'E-Mail', article: 'die', plural: '-s', meaning: '電子郵件', englishMeaning: 'email', level: 'A1', type: 'noun', conjugation: '', example: 'Schick mir eine E-Mail.', exampleMeaning: '寄一封電子郵件給我。' },
{ word: 'Sprache', article: 'die', plural: '-n', meaning: '語言', englishMeaning: 'language', level: 'A1', type: 'noun', conjugation: '', example: 'Welche Sprachen sprichst du?', exampleMeaning: '你會說哪些語言？' },
{ word: 'Deutsch', article: 'das', plural: '', meaning: '德語', englishMeaning: 'German (language)', level: 'A1', type: 'noun', conjugation: '', example: 'Deutsch ist nicht einfach.', exampleMeaning: '德語不簡單。' },
{ word: 'Englisch', article: 'das', plural: '', meaning: '英語', englishMeaning: 'English (language)', level: 'A1', type: 'noun', conjugation: '', example: 'Er spricht gut Englisch.', exampleMeaning: '他英語說得不錯。' },
{ word: 'Essen', article: 'das', plural: '', meaning: '食物', englishMeaning: 'food', level: 'A1', type: 'noun', conjugation: '', example: 'Das Essen ist lecker.', exampleMeaning: '這食物很好吃。' },
{ word: 'Getränk', article: 'das', plural: '-e', meaning: '飲料', englishMeaning: 'drink', level: 'A1', type: 'noun', conjugation: '', example: 'Ich bestelle ein Getränk.', exampleMeaning: '我點一杯飲料。' },
{ word: 'Reis', article: 'der', plural: '', meaning: '米飯', englishMeaning: 'rice', level: 'A1', type: 'noun', conjugation: '', example: 'Wir essen Reis mit Gemüse.', exampleMeaning: '我們吃米飯配蔬菜。' },
{ word: 'Nudel', article: 'die', plural: '-n', meaning: '麵條', englishMeaning: 'noodle', level: 'A1', type: 'noun', conjugation: '', example: 'Die Kinder mögen Nudeln.', exampleMeaning: '孩子們喜歡麵條。' },
{ word: 'Kartoffel', article: 'die', plural: '-n', meaning: '馬鈴薯', englishMeaning: 'potato', level: 'A1', type: 'noun', conjugation: '', example: 'Isst du gern Kartoffeln?', exampleMeaning: '你喜歡吃馬鈴薯嗎？' },
{ word: 'Salat', article: 'der', plural: '-e', meaning: '沙拉', englishMeaning: 'salad', level: 'A1', type: 'noun', conjugation: '', example: 'Ich nehme einen Salat als Vorspeise.', exampleMeaning: '我點一份沙拉當作前菜。' },
{ word: 'Zucker', article: 'der', plural: '', meaning: '糖', englishMeaning: 'sugar', level: 'A1', type: 'noun', conjugation: '', example: 'Der Kaffee ist zu viel Zucker.', exampleMeaning: '這咖啡糖太多了。' },
{ word: 'Salz', article: 'das', plural: '', meaning: '鹽', englishMeaning: 'salt', level: 'A1', type: 'noun', conjugation: '', example: 'Gib mir bitte das Salz.', exampleMeaning: '請把鹽給我。' },
{ word: 'Kino', article: 'das', plural: '-s', meaning: '電影院', englishMeaning: 'cinema', level: 'A1', type: 'noun', conjugation: '', example: 'Gehen wir heute Abend ins Kino?', exampleMeaning: '我們今晚去看電影嗎？' },
{ word: 'Museum', article: 'das', plural: 'Museen', meaning: '博物館', englishMeaning: 'museum', level: 'A1', type: 'noun', conjugation: '', example: 'Das Museum ist sehr alt.', exampleMeaning: '這間博物館很老舊。' },
{ word: 'Park', article: 'der', plural: '-s', meaning: '公園', englishMeaning: 'park', level: 'A1', type: 'noun', conjugation: '', example: 'Wir treffen uns im Park.', exampleMeaning: '我們在公園碰面。' },
{ word: 'Schwimmbad', article: 'das', plural: '-bäder', meaning: '游泳池', englishMeaning: 'swimming pool', level: 'A1', type: 'noun', conjugation: '', example: 'Im Sommer gehe ich oft ins Schwimmbad.', exampleMeaning: '夏天我常去游泳池。' },
{ word: 'Bank', article: 'die', plural: '-en', meaning: '銀行', englishMeaning: 'bank', level: 'A1', type: 'noun', conjugation: '', example: 'Ich muss zur Bank.', exampleMeaning: '我必須去銀行。' },
{ word: 'Post', article: 'die', plural: '', meaning: '郵局', englishMeaning: 'post office', level: 'A1', type: 'noun', conjugation: '', example: 'Die Post ist gleich nebenan.', exampleMeaning: '郵局就在隔壁。' },
{ word: 'Apotheke', article: 'die', plural: '-n', meaning: '藥局', englishMeaning: 'pharmacy', level: 'A1', type: 'noun', conjugation: '', example: 'Ich brauche Medikamente von der Apotheke.', exampleMeaning: '我需要藥局的藥物。' },
{ word: 'Bahnhof', article: 'der', plural: '-höfe', meaning: '火車站', englishMeaning: 'train station', level: 'A1', type: 'noun', conjugation: '', example: 'Wir warten am Bahnhof.', exampleMeaning: '我們在火車站等候。' },
{ word: 'Flughafen', article: 'der', plural: '-häfen', meaning: '機場', englishMeaning: 'airport', level: 'A1', type: 'noun', conjugation: '', example: 'Ich hole dich am Flughafen ab.', exampleMeaning: '我去機場接你。' },
{ word: 'Krankenhaus', article: 'das', plural: '-häuser', meaning: '醫院', englishMeaning: 'hospital', level: 'A1', type: 'noun', conjugation: '', example: 'Er arbeitet im Krankenhaus.', exampleMeaning: '他在醫院工作。' },
{ word: 'Polizei', article: 'die', plural: '', meaning: '警察局', englishMeaning: 'police', level: 'A1', type: 'noun', conjugation: '', example: 'Ruf die Polizei!', exampleMeaning: '打電話報警！' },
{ word: 'links', article: '', plural: '', meaning: '左邊', englishMeaning: 'left', level: 'A1', type: 'adv', conjugation: '', example: 'Gehen Sie an der Kreuzung links.', exampleMeaning: '在十字路口向左轉。' },
{ word: 'rechts', article: '', plural: '', meaning: '右邊', englishMeaning: 'right', level: 'A1', type: 'adv', conjugation: '', example: 'Das Geschäft ist auf der rechten Seite.', exampleMeaning: '那間店在右手邊。' },
{ word: 'geradeaus', article: '', plural: '', meaning: '直走', englishMeaning: 'straight ahead', level: 'A1', type: 'adv', conjugation: '', example: 'Fahren Sie geradeaus bis zur Ampel.', exampleMeaning: '直開到紅綠燈。' },
{ word: 'weit', article: '', plural: '', meaning: '遠的', englishMeaning: 'far', level: 'A1', type: 'adj', conjugation: '', example: 'Ist es weit bis zur Post?', exampleMeaning: '到郵局很遠嗎？' },
{ word: 'nah', article: '', plural: '', meaning: '近的', englishMeaning: 'near', level: 'A1', type: 'adj', conjugation: '', example: 'Wir wohnen nah am Zentrum.', exampleMeaning: '我們住在離市中心近的地方。' },
{ word: 'Zeit', article: 'die', plural: '', meaning: '時間', englishMeaning: 'time', level: 'A1', type: 'noun', conjugation: '', example: 'Haben Sie Zeit für mich?', exampleMeaning: '您有時間給我嗎？' },
{ word: 'Minute', article: 'die', plural: '-n', meaning: '分鐘', englishMeaning: 'minute', level: 'A1', type: 'noun', conjugation: '', example: 'Wir warten nur noch eine Minute.', exampleMeaning: '我們再等一分鐘就好。' },
{ word: 'Stunde', article: 'die', plural: '-n', meaning: '小時', englishMeaning: 'hour', level: 'A1', type: 'noun', conjugation: '', example: 'Der Kurs dauert zwei Stunden.', exampleMeaning: '這個課程持續兩小時。' },
{ word: 'Wochenende', article: 'das', plural: '-n', meaning: '週末', englishMeaning: 'weekend', level: 'A1', type: 'noun', conjugation: '', example: 'Was machst du am Wochenende?', exampleMeaning: '你週末做什麼？' },
{ word: 'morgens', article: '', plural: '', meaning: '早上 (副詞)', englishMeaning: 'in the morning', level: 'A1', type: 'adv', conjugation: '', example: 'Ich trinke morgens Kaffee.', exampleMeaning: '我早上喝咖啡。' },
{ word: 'abends', article: '', plural: '', meaning: '晚上 (副詞)', englishMeaning: 'in the evening', level: 'A1', type: 'adv', conjugation: '', example: 'Abends sehen wir fern.', exampleMeaning: '我們晚上看電視。' },
{ word: 'spät', article: '', plural: '', meaning: '晚的', englishMeaning: 'late', level: 'A1', type: 'adj', conjugation: '', example: 'Es ist schon sehr spät.', exampleMeaning: '已經很晚了。' },
{ word: 'früh', article: '', plural: '', meaning: '早的', englishMeaning: 'early', level: 'A1', type: 'adj', conjugation: '', example: 'Ich stehe jeden Tag früh auf.', exampleMeaning: '我每天很早起床。' },
{ word: 'Uhrzeit', article: 'die', plural: '-en', meaning: '時間點', englishMeaning: 'time of day', level: 'A1', type: 'noun', conjugation: '', example: 'Welche Uhrzeit haben wir?', exampleMeaning: '現在是幾點？' },
{ word: 'Haltestelle', article: 'die', plural: '-n', meaning: '車站 (公車/電車)', englishMeaning: 'stop (bus/tram)', level: 'A1', type: 'noun', conjugation: '', example: 'Die Haltestelle ist dort drüben.', exampleMeaning: '車站就在那邊。' },
{ word: 'fahren', article: '', plural: '', meaning: '開車；搭乘', englishMeaning: 'to drive; to ride', level: 'A1', type: 'verb', conjugation: 'er fährt, fuhr, ist gefahren', example: 'Ich fahre jeden Tag mit dem Rad.', exampleMeaning: '我每天騎腳踏車。' },
{ word: 'fliegen', article: '', plural: '', meaning: '飛', englishMeaning: 'to fly', level: 'A1', type: 'verb', conjugation: 'er fliegt, flog, ist geflogen', example: 'Wir fliegen nach London.', exampleMeaning: '我們飛往倫敦。' },
{ word: 'laufen', article: '', plural: '', meaning: '跑步；行走', englishMeaning: 'to run; to walk', level: 'A1', type: 'verb', conjugation: 'er läuft, lief, ist gelaufen', example: 'Er läuft sehr schnell.', exampleMeaning: '他跑得很快。' },
{ word: 'fragen', article: '', plural: '', meaning: '問', englishMeaning: 'to ask', level: 'A1', type: 'verb', conjugation: 'er fragt, fragte, hat gefragt', example: 'Ich habe eine Frage an dich.', exampleMeaning: '我有一個問題要問你。' },
{ word: 'antworten', article: '', plural: '', meaning: '回答', englishMeaning: 'to answer', level: 'A1', type: 'verb', conjugation: 'er antwortet, antwortete, hat geantwortet', example: 'Er antwortet immer schnell.', exampleMeaning: '他總是很快回答。' },
{ word: 'verboten', article: '', plural: '', meaning: '被禁止的', englishMeaning: 'forbidden', level: 'A1', type: 'adj', conjugation: '', example: 'Rauchen ist hier verboten.', exampleMeaning: '這裡禁止吸煙。' },
{ word: 'möglich', article: '', plural: '', meaning: '可能的', englishMeaning: 'possible', level: 'A1', type: 'adj', conjugation: '', example: 'Ist das möglich?', exampleMeaning: '這可能嗎？' },
{ word: 'allein', article: '', plural: '', meaning: '單獨地', englishMeaning: 'alone', level: 'A1', type: 'adv', conjugation: '', example: 'Ich wohne allein.', exampleMeaning: '我一個人住。' },
{ word: 'zusammen', article: '', plural: '', meaning: '一起', englishMeaning: 'together', level: 'A1', type: 'adv', conjugation: '', example: 'Wir arbeiten zusammen.', exampleMeaning: '我們一起工作。' },
{ word: 'gern', article: '', plural: '', meaning: '樂意地', englishMeaning: 'with pleasure', level: 'A1', type: 'adv', conjugation: '', example: 'Ich komme gern mit.', exampleMeaning: '我很樂意一起去。' },
{ word: 'Leute', article: 'die (Pl.)', plural: '-', meaning: '人們', englishMeaning: 'people', level: 'A1', type: 'noun', conjugation: '', example: 'Viele Leute warten.', exampleMeaning: '很多人在等。' },
{ word: 'Hund', article: 'der', plural: '-e', meaning: '狗', englishMeaning: 'dog', level: 'A1', type: 'noun', conjugation: '', example: 'Der Hund ist sehr lieb.', exampleMeaning: '這隻狗很可愛。' },
{ word: 'Katze', article: 'die', plural: '-n', meaning: '貓', englishMeaning: 'cat', level: 'A1', type: 'noun', conjugation: '', example: 'Die Katze schläft auf dem Sofa.', exampleMeaning: '貓在沙發上睡覺。' },
{ word: 'Arbeit', article: 'die', plural: '-en', meaning: '工作', englishMeaning: 'work', level: 'A1', type: 'noun', conjugation: '', example: 'Ich habe viel Arbeit.', exampleMeaning: '我有很多工作。' },
{ word: 'Kollege', article: 'der', plural: '-n', meaning: '同事 (男)', englishMeaning: 'colleague (male)', level: 'A1', type: 'noun', conjugation: '', example: 'Das ist mein Kollege Herr Schmidt.', exampleMeaning: '這是我的男同事施密特先生。' },
{ word: 'Kollegin', article: 'die', plural: '-nen', meaning: '同事 (女)', englishMeaning: 'colleague (female)', level: 'A1', type: 'noun', conjugation: '', example: 'Sie ist eine nette Kollegin.', exampleMeaning: '她是一位和善的女同事。' },
{ word: 'Pause', article: 'die', plural: '-n', meaning: '休息', englishMeaning: 'break', level: 'A1', type: 'noun', conjugation: '', example: 'Machen wir eine kurze Pause.', exampleMeaning: '我們休息一下吧。' },
{ word: 'Einkaufszettel', article: 'der', plural: '-', meaning: '購物清單', englishMeaning: 'shopping list', level: 'A1', type: 'noun', conjugation: '', example: 'Ich habe meinen Einkaufszettel vergessen.', exampleMeaning: '我忘了我的購物清單。' },
{ word: 'Kleidung', article: 'die', plural: '', meaning: '衣服', englishMeaning: 'clothing', level: 'A1', type: 'noun', conjugation: '', example: 'Sie kauft neue Kleidung.', exampleMeaning: '她買新衣服。' },
{ word: 'Hemd', article: 'das', plural: '-en', meaning: '襯衫', englishMeaning: 'shirt', level: 'A1', type: 'noun', conjugation: '', example: 'Das Hemd ist weiß.', exampleMeaning: '這件襯衫是白色的。' },
{ word: 'Hose', article: 'die', plural: '-n', meaning: '褲子', englishMeaning: 'trousers', level: 'A1', type: 'noun', conjugation: '', example: 'Die Hose passt nicht mehr.', exampleMeaning: '這條褲子不合適了。' },
{ word: 'Schuh', article: 'der', plural: '-e', meaning: '鞋子', englishMeaning: 'shoe', level: 'A1', type: 'noun', conjugation: '', example: 'Die Schuhe sind bequem.', exampleMeaning: '這雙鞋很舒服。' },
{ word: 'Jacke', article: 'die', plural: '-n', meaning: '夾克', englishMeaning: 'jacket', level: 'A1', type: 'noun', conjugation: '', example: 'Zieh deine Jacke an.', exampleMeaning: '穿上你的夾克。' },
{ word: 'Farbe', article: 'die', plural: '-n', meaning: '顏色', englishMeaning: 'color', level: 'A1', type: 'noun', conjugation: '', example: 'Was ist deine Lieblingsfarbe?', exampleMeaning: '你最喜歡的顏色是什麼？' },
{ word: 'rot', article: '', plural: '', meaning: '紅色的', englishMeaning: 'red', level: 'A1', type: 'adj', conjugation: '', example: 'Das Auto ist rot.', exampleMeaning: '這輛車是紅色的。' },
{ word: 'blau', article: '', plural: '', meaning: '藍色的', englishMeaning: 'blue', level: 'A1', type: 'adj', conjugation: '', example: 'Ich mag die blaue Farbe.', exampleMeaning: '我喜歡藍色。' },
{ word: 'gelb', article: '', plural: '', meaning: '黃色的', englishMeaning: 'yellow', level: 'A1', type: 'adj', conjugation: '', example: 'Die Sonne ist gelb.', exampleMeaning: '太陽是黃色的。' },
{ word: 'grün', article: '', plural: '', meaning: '綠色的', englishMeaning: 'green', level: 'A1', type: 'adj', conjugation: '', example: 'Der Baum ist grün.', exampleMeaning: '這棵樹是綠色的。' },
{ word: 'schwarz', article: '', plural: '', meaning: '黑色的', englishMeaning: 'black', level: 'A1', type: 'adj', conjugation: '', example: 'Sie trägt ein schwarzes Kleid.', exampleMeaning: '她穿著一件黑色的洋裝。' },
{ word: 'weiß', article: '', plural: '', meaning: '白色的', englishMeaning: 'white', level: 'A1', type: 'adj', conjugation: '', example: 'Das Blatt Papier ist weiß.', exampleMeaning: '這張紙是白色的。' },
{ word: 'Kopf', article: 'der', plural: 'Köpfe', meaning: '頭', englishMeaning: 'head', level: 'A1', type: 'noun', conjugation: '', example: 'Ich habe Kopfschmerzen.', exampleMeaning: '我頭痛。' },
{ word: 'Arm', article: 'der', plural: '-e', meaning: '手臂', englishMeaning: 'arm', level: 'A1', type: 'noun', conjugation: '', example: 'Er hat sich den Arm gebrochen.', exampleMeaning: '他的手臂骨折了。' },
{ word: 'Bein', article: 'das', plural: '-e', meaning: '腿', englishMeaning: 'leg', level: 'A1', type: 'noun', conjugation: '', example: 'Mein Bein tut weh.', exampleMeaning: '我的腿很痛。' },
{ word: 'Fuß', article: 'der', plural: 'Füße', meaning: '腳', englishMeaning: 'foot', level: 'A1', type: 'noun', conjugation: '', example: 'Er steht auf einem Fuß.', exampleMeaning: '他單腳站立。' },
{ word: 'Hand', article: 'die', plural: 'Hände', meaning: '手', englishMeaning: 'hand', level: 'A1', type: 'noun', conjugation: '', example: 'Gib mir deine Hand.', exampleMeaning: '把你的手給我。' },
{ word: 'Auge', article: 'das', plural: '-n', meaning: '眼睛', englishMeaning: 'eye', level: 'A1', type: 'noun', conjugation: '', example: 'Sie hat blaue Augen.', exampleMeaning: '她有藍色的眼睛。' },
{ word: 'Ohr', article: 'das', plural: '-en', meaning: '耳朵', englishMeaning: 'ear', level: 'A1', type: 'noun', conjugation: '', example: 'Das Baby hat kleine Ohren.', exampleMeaning: '這個寶寶有小耳朵。' },
{ word: 'Mund', article: 'der', plural: 'Münder', meaning: '嘴巴', englishMeaning: 'mouth', level: 'A1', type: 'noun', conjugation: '', example: 'Mach deinen Mund auf.', exampleMeaning: '張開你的嘴巴。' },
{ word: 'Nase', article: 'die', plural: '-n', meaning: '鼻子', englishMeaning: 'nose', level: 'A1', type: 'noun', conjugation: '', example: 'Die Nase ist rot.', exampleMeaning: '鼻子是紅色的。' },
{ word: 'krank', article: '', plural: '', meaning: '生病的', englishMeaning: 'sick', level: 'A1', type: 'adj', conjugation: '', example: 'Ich bin heute krank.', exampleMeaning: '我今天生病了。' },
{ word: 'gesund', article: '', plural: '', meaning: '健康的', englishMeaning: 'healthy', level: 'A1', type: 'adj', conjugation: '', example: 'Obst ist sehr gesund.', exampleMeaning: '水果非常健康。' },
{ word: 'Medikament', article: 'das', plural: '-e', meaning: '藥物', englishMeaning: 'medicine', level: 'A1', type: 'noun', conjugation: '', example: 'Nimmst du Medikamente?', exampleMeaning: '你有在吃藥嗎？' },
{ word: 'Schmerz', article: 'der', plural: '-en', meaning: '疼痛', englishMeaning: 'pain', level: 'A1', type: 'noun', conjugation: '', example: 'Ich habe starke Schmerzen.', exampleMeaning: '我感到強烈的疼痛。' },
{ word: 'lachen', article: '', plural: '', meaning: '笑', englishMeaning: 'to laugh', level: 'A1', type: 'verb', conjugation: 'er lacht, lachte, hat gelacht', example: 'Sie lacht über den Witz.', exampleMeaning: '她對這個笑話笑了。' },
{ word: 'weinen', article: '', plural: '', meaning: '哭', englishMeaning: 'to cry', level: 'A1', type: 'verb', conjugation: 'er weint, weinte, hat geweint', example: 'Warum weint das Kind?', exampleMeaning: '這個孩子為什麼哭？' },
{ word: 'tanzen', article: '', plural: '', meaning: '跳舞', englishMeaning: 'to dance', level: 'A1', type: 'verb', conjugation: 'er tanzt, tanzte, hat getanzt', example: 'Wir tanzen auf der Party.', exampleMeaning: '我們在派對上跳舞。' },
{ word: 'singen', article: '', plural: '', meaning: '唱歌', englishMeaning: 'to sing', level: 'A1', type: 'verb', conjugation: 'er singt, sang, hat gesungen', example: 'Kannst du gut singen?', exampleMeaning: '你唱歌好聽嗎？' },
{ word: 'fotografieren', article: '', plural: '', meaning: '拍照', englishMeaning: 'to photograph', level: 'A1', type: 'verb', conjugation: 'er fotografiert, fotografierte, hat fotografiert', example: 'Er fotografiert gerne Blumen.', exampleMeaning: '他喜歡拍花。' },
{ word: 'braun', article: '', plural: '', meaning: '棕色的', englishMeaning: 'brown', level: 'A1', type: 'adj', conjugation: '', example: 'Er hat braune Haare.', exampleMeaning: '他有棕色的頭髮。' },
{ word: 'grau', article: '', plural: '', meaning: '灰色的', englishMeaning: 'gray', level: 'A1', type: 'adj', conjugation: '', example: 'Der Himmel ist grau.', exampleMeaning: '天空是灰色的。' },
{ word: 'dunkel', article: '', plural: '', meaning: '黑暗的', englishMeaning: 'dark', level: 'A1', type: 'adj', conjugation: '', example: 'Das Zimmer ist dunkel.', exampleMeaning: '這個房間很暗。' },
{ word: 'hell', article: '', plural: '', meaning: '明亮的', englishMeaning: 'bright', level: 'A1', type: 'adj', conjugation: '', example: 'Die Sonne ist sehr hell.', exampleMeaning: '陽光很強烈。' },
{ word: 'sauber', article: '', plural: '', meaning: '乾淨的', englishMeaning: 'clean', level: 'A1', type: 'adj', conjugation: '', example: 'Dein Auto ist sauber.', exampleMeaning: '你的車是乾淨的。' },
{ word: 'schmutzig', article: '', plural: '', meaning: '髒的', englishMeaning: 'dirty', level: 'A1', type: 'adj', conjugation: '', example: 'Die Schuhe sind schmutzig.', exampleMeaning: '鞋子很髒。' },
{ word: 'alle', article: '', plural: '', meaning: '全部的', englishMeaning: 'all', level: 'A1', type: 'pronoun', conjugation: '', example: 'Alle Studenten sind da.', exampleMeaning: '所有學生都在這裡。' },
{ word: 'beide', article: '', plural: '', meaning: '兩者都', englishMeaning: 'both', level: 'A1', type: 'pronoun', conjugation: '', example: 'Beide Eltern arbeiten.', exampleMeaning: '父母兩位都工作。' },
{ word: 'etwas', article: '', plural: '', meaning: '一些；某物', englishMeaning: 'something; a little', level: 'A1', type: 'pronoun', conjugation: '', example: 'Möchtest du etwas essen?', exampleMeaning: '你想吃點東西嗎？' },
{ word: 'nichts', article: '', plural: '', meaning: '沒有什麼', englishMeaning: 'nothing', level: 'A1', type: 'pronoun', conjugation: '', example: 'Ich habe nichts gehört.', exampleMeaning: '我什麼都沒聽到。' },
{ word: 'viel', article: '', plural: '', meaning: '很多', englishMeaning: 'much; a lot', level: 'A1', type: 'pronoun', conjugation: '', example: 'Ich habe viel gelernt.', exampleMeaning: '我學了很多。' },
{ word: 'wenig', article: '', plural: '', meaning: '很少', englishMeaning: 'little; few', level: 'A1', type: 'pronoun', conjugation: '', example: 'Ich habe wenig Zeit.', exampleMeaning: '我沒什麼時間。' },
{ word: 'kein', article: '', plural: '', meaning: '沒有 (否定冠詞)', englishMeaning: 'no; not a', level: 'A1', type: 'article', conjugation: '', example: 'Ich habe kein Auto.', exampleMeaning: '我沒有車。' },
{ word: 'ein', article: '', plural: '', meaning: '一個 (不定冠詞)', englishMeaning: 'a; an', level: 'A1', type: 'article', conjugation: '', example: 'Ich habe einen Hund.', exampleMeaning: '我有一隻狗。' },
{ word: 'der', article: '', plural: '', meaning: '定冠詞 (陽性)', englishMeaning: 'the (masculine)', level: 'A1', type: 'article', conjugation: '', example: 'Der Tisch ist neu.', exampleMeaning: '這張桌子是新的。' },
{ word: 'die', article: '', plural: '', meaning: '定冠詞 (陰性/複數)', englishMeaning: 'the (feminine/plural)', level: 'A1', type: 'article', conjugation: '', example: 'Die Lampe ist schön.', exampleMeaning: '這盞燈很漂亮。' },
{ word: 'das', article: '', plural: '', meaning: '定冠詞 (中性)', englishMeaning: 'the (neuter)', level: 'A1', type: 'article', conjugation: '', example: 'Das Haus ist alt.', exampleMeaning: '這間房子很老。' },
{ word: 'ich', article: '', plural: '', meaning: '我', englishMeaning: 'I', level: 'A1', type: 'pronoun', conjugation: '', example: 'Ich bin müde.', exampleMeaning: '我累了。' },
{ word: 'du', article: '', plural: '', meaning: '你', englishMeaning: 'you (singular informal)', level: 'A1', type: 'pronoun', conjugation: '', example: 'Du bist sehr nett.', exampleMeaning: '你非常友善。' },
{ word: 'er', article: '', plural: '', meaning: '他', englishMeaning: 'he', level: 'A1', type: 'pronoun', conjugation: '', example: 'Er arbeitet als Koch.', exampleMeaning: '他當廚師。' },
{ word: 'sie', article: '', plural: '', meaning: '她', englishMeaning: 'she', level: 'A1', type: 'pronoun', conjugation: '', example: 'Sie wohnt in Köln.', exampleMeaning: '她住在科隆。' },
{ word: 'es', article: '', plural: '', meaning: '它', englishMeaning: 'it', level: 'A1', type: 'pronoun', conjugation: '', example: 'Das ist ein Buch. Es ist interessant.', exampleMeaning: '這是一本書。它很有趣。' },
{ word: 'wir', article: '', plural: '', meaning: '我們', englishMeaning: 'we', level: 'A1', type: 'pronoun', conjugation: '', example: 'Wir gehen spazieren.', exampleMeaning: '我們去散步。' },
{ word: 'ihr', article: '', plural: '', meaning: '你們', englishMeaning: 'you (plural informal)', level: 'A1', type: 'pronoun', conjugation: '', example: 'Macht ihr mit?', exampleMeaning: '你們要加入嗎？' },
{ word: 'sie (Pl.)', article: '', plural: '', meaning: '他們/她們/它們', englishMeaning: 'they', level: 'A1', type: 'pronoun', conjugation: '', example: 'Wo sind die Kinder? Sie spielen draußen.', exampleMeaning: '孩子們在哪裡？他們在外面玩。' },
{ word: 'Sie (formal)', article: '', plural: '', meaning: '您/你們 (正式)', englishMeaning: 'you (formal)', level: 'A1', type: 'pronoun', conjugation: '', example: 'Sprechen Sie Deutsch?', exampleMeaning: '您說德語嗎？' },
{ word: 'mein', article: '', plural: '', meaning: '我的', englishMeaning: 'my', level: 'A1', type: 'pronoun', conjugation: '', example: 'Das ist mein Handy.', exampleMeaning: '這是我的手機。' },
{ word: 'dein', article: '', plural: '', meaning: '你的', englishMeaning: 'your (informal)', level: 'A1', type: 'pronoun', conjugation: '', example: 'Ist das dein Fahrrad?', exampleMeaning: '這是你的腳踏車嗎？' },
{ word: 'sein', article: '', plural: '', meaning: '他的', englishMeaning: 'his', level: 'A1', type: 'pronoun', conjugation: '', example: 'Das ist sein Auto.', exampleMeaning: '這是他的車。' },
{ word: 'ihr (Possessiv)', article: '', plural: '', meaning: '她的；他們的', englishMeaning: 'her; their', level: 'A1', type: 'pronoun', conjugation: '', example: 'Das ist ihre Tasche.', exampleMeaning: '這是她的包包。' },
{ word: 'unser', article: '', plural: '', meaning: '我們的', englishMeaning: 'our', level: 'A1', type: 'pronoun', conjugation: '', example: 'Das ist unser Haus.', exampleMeaning: '這是我們的房子。' },
{ word: 'euer', article: '', plural: '', meaning: '你們的', englishMeaning: 'your (plural informal)', level: 'A1', type: 'pronoun', conjugation: '', example: 'Ist das euer Hund?', exampleMeaning: '這是你們的狗嗎？' },
{ word: 'Ihr (Possessiv)', article: '', plural: '', meaning: '您的', englishMeaning: 'your (formal)', level: 'A1', type: 'pronoun', conjugation: '', example: 'Ist das Ihr Termin?', exampleMeaning: '這是您的預約嗎？' }
];

// ==========================================
// 📚 內建單字庫：A2 等級
// ==========================================
const BUILT_IN_WORDS_A2 = [
  { word: 'beginnen', article: '', plural: '', meaning: '開始', englishMeaning: 'to begin', level: 'A2', type: 'verb', conjugation: 'er beginnt, begann, hat begonnen', example: 'Der Kurs beginnt um neun Uhr.', exampleMeaning: '課程九點開始。' },
{ word: 'enden', article: '', plural: '', meaning: '結束', englishMeaning: 'to end', level: 'A2', type: 'verb', conjugation: 'er endet, endete, hat geendet', example: 'Die Vorstellung endet bald.', exampleMeaning: '演出很快就會結束。' },
{ word: 'verpassen', article: '', plural: '', meaning: '錯過', englishMeaning: 'to miss', level: 'A2', type: 'verb', conjugation: 'er verpasst, verpasste, hat verpasst', example: 'Ich habe den Zug verpasst.', exampleMeaning: '我錯過了火車。' },
{ word: 'vorbereiten', article: '', plural: '', meaning: '準備', englishMeaning: 'to prepare', level: 'A2', type: 'verb', conjugation: 'er bereitet vor, bereitete vor, hat vorbereitet', example: 'Ich muss die Präsentation vorbereiten.', exampleMeaning: '我必須準備這份簡報。' },
{ word: 'entscheiden', article: '', plural: '', meaning: '決定', englishMeaning: 'to decide', level: 'A2', type: 'verb', conjugation: 'er entscheidet, entschied, hat entschieden', example: 'Er hat sich für das Angebot entschieden.', exampleMeaning: '他決定接受這個報價。' },
{ word: 'erklären', article: '', plural: '', meaning: '解釋', englishMeaning: 'to explain', level: 'A2', type: 'verb', conjugation: 'er erklärt, erklärte, hat erklärt', example: 'Kannst du mir das erklären?', exampleMeaning: '你能向我解釋這個嗎？' },
{ word: 'passieren', article: '', plural: '', meaning: '發生', englishMeaning: 'to happen', level: 'A2', type: 'verb', conjugation: 'es passiert, passierte, ist passiert', example: 'Was ist passiert?', exampleMeaning: '發生了什麼事？' },
{ word: 'teilnehmen', article: '', plural: '', meaning: '參加', englishMeaning: 'to participate', level: 'A2', type: 'verb', conjugation: 'er nimmt teil, nahm teil, hat teilgenommen', example: 'Nimmst du am Treffen teil?', exampleMeaning: '你會參加這個會議嗎？' },
{ word: 'vergessen', article: '', plural: '', meaning: '忘記', englishMeaning: 'to forget', level: 'A2', type: 'verb', conjugation: 'er vergisst, vergaß, hat vergessen', example: 'Ich habe meinen Schlüssel vergessen.', exampleMeaning: '我忘了帶我的鑰匙。' },
{ word: 'unterwegs', article: '', plural: '', meaning: '在路上', englishMeaning: 'on the way', level: 'A2', type: 'adv', conjugation: '', example: 'Wir sind noch unterwegs.', exampleMeaning: '我們還在路上。' },
{ word: 'plötzlich', article: '', plural: '', meaning: '突然地', englishMeaning: 'suddenly', level: 'A2', type: 'adv', conjugation: '', example: 'Plötzlich fing es an zu regnen.', exampleMeaning: '天突然開始下雨。' },
{ word: 'gerade', article: '', plural: '', meaning: '正好；剛才', englishMeaning: 'just (now); straight', level: 'A2', type: 'adv', conjugation: '', example: 'Ich komme gerade von der Arbeit.', exampleMeaning: '我剛下班回來。' },
{ word: 'trotzdem', article: '', plural: '', meaning: '儘管如此', englishMeaning: 'nevertheless', level: 'A2', type: 'adv', conjugation: '', example: 'Es regnet, trotzdem gehen wir spazieren.', exampleMeaning: '雖然下雨，但我們仍然去散步。' },
{ word: 'deshalb', article: '', plural: '', meaning: '因此', englishMeaning: 'therefore', level: 'A2', type: 'adv', conjugation: '', example: 'Ich war krank, deshalb bin ich zu Hause geblieben.', exampleMeaning: '我生病了，因此我待在家。' },
{ word: 'dort', article: '', plural: '', meaning: '在那裡', englishMeaning: 'there', level: 'A2', type: 'adv', conjugation: '', example: 'Warte dort auf mich.', exampleMeaning: '在那裡等我。' },
{ word: 'hier', article: '', plural: '', meaning: '在這裡', englishMeaning: 'here', level: 'A2', type: 'adv', conjugation: '', example: 'Komm bitte hierher.', exampleMeaning: '請來這裡。' },
{ word: 'unbedingt', article: '', plural: '', meaning: '絕對地；務必', englishMeaning: 'absolutely', level: 'A2', type: 'adv', conjugation: '', example: 'Das muss ich unbedingt sehen.', exampleMeaning: '我絕對要看這個。' },
{ word: 'pünktlich', article: '', plural: '', meaning: '準時的', englishMeaning: 'punctual', level: 'A2', type: 'adj', conjugation: '', example: 'Wir müssen pünktlich sein.', exampleMeaning: '我們必須準時。' },
{ word: 'wichtig', article: '', plural: '', meaning: '重要的', englishMeaning: 'important', level: 'A2', type: 'adj', conjugation: '', example: 'Das ist eine wichtige Information.', exampleMeaning: '這是一個重要的資訊。' },
{ word: 'interessant', article: '', plural: '', meaning: '有趣的', englishMeaning: 'interesting', level: 'A2', type: 'adj', conjugation: '', example: 'Das Buch ist sehr interessant.', exampleMeaning: '這本書非常有趣。' },
{ word: 'langweilig', article: '', plural: '', meaning: '無聊的', englishMeaning: 'boring', level: 'A2', type: 'adj', conjugation: '', example: 'Der Film war sehr langweilig.', exampleMeaning: '這部電影很無聊。' },
{ word: 'stark', article: '', plural: '', meaning: '強壯的；強烈的', englishMeaning: 'strong', level: 'A2', type: 'adj', conjugation: '', example: 'Er ist sehr stark.', exampleMeaning: '他非常強壯。' },
{ word: 'schwach', article: '', plural: '', meaning: '虛弱的', englishMeaning: 'weak', level: 'A2', type: 'adj', conjugation: '', example: 'Ich fühle mich heute schwach.', exampleMeaning: '我今天覺得很虛弱。' },
{ word: 'fröhlich', article: '', plural: '', meaning: '快樂的', englishMeaning: 'happy; cheerful', level: 'A2', type: 'adj', conjugation: '', example: 'Sie ist ein fröhliches Kind.', exampleMeaning: '她是一個快樂的小孩。' },
{ word: 'traurig', article: '', plural: '', meaning: '悲傷的', englishMeaning: 'sad', level: 'A2', type: 'adj', conjugation: '', example: 'Er ist traurig, weil er verloren hat.', exampleMeaning: '他很難過，因為他輸了。' },
{ word: 'geduldig', article: '', plural: '', meaning: '有耐心的', englishMeaning: 'patient', level: 'A2', type: 'adj', conjugation: '', example: 'Der Lehrer ist sehr geduldig.', exampleMeaning: '這位老師非常有耐心。' },
{ word: 'unfreundlich', article: '', plural: '', meaning: '不友善的', englishMeaning: 'unfriendly', level: 'A2', type: 'adj', conjugation: '', example: 'Die Bedienung war unfreundlich.', exampleMeaning: '服務員很不友善。' },
{ word: 'zufrieden', article: '', plural: '', meaning: '滿意的', englishMeaning: 'satisfied', level: 'A2', type: 'adj', conjugation: '', example: 'Ich bin mit dem Ergebnis zufrieden.', exampleMeaning: '我對這個結果很滿意。' },
{ word: 'hungrig', article: '', plural: '', meaning: '飢餓的', englishMeaning: 'hungry', level: 'A2', type: 'adj', conjugation: '', example: 'Ich bin sehr hungrig.', exampleMeaning: '我非常餓。' },
{ word: 'durstig', article: '', plural: '', meaning: '口渴的', englishMeaning: 'thirsty', level: 'A2', type: 'adj', conjugation: '', example: 'Nach dem Sport bin ich durstig.', exampleMeaning: '運動後我很口渴。' },
{ word: 'billig', article: '', plural: '', meaning: '便宜的', englishMeaning: 'cheap', level: 'A2', type: 'adj', conjugation: '', example: 'Das ist sehr billig.', exampleMeaning: '這非常便宜。' },
{ word: 'teuer', article: '', plural: '', meaning: '昂貴的', englishMeaning: 'expensive', level: 'A2', type: 'adj', conjugation: '', example: 'Die Miete ist sehr teuer.', exampleMeaning: '房租非常貴。' },
{ word: 'öffentlich', article: '', plural: '', meaning: '公共的', englishMeaning: 'public', level: 'A2', type: 'adj', conjugation: '', example: 'Das ist ein öffentliches Gebäude.', exampleMeaning: '這是一棟公共建築。' },
{ word: 'persönlich', article: '', plural: '', meaning: '個人的', englishMeaning: 'personal', level: 'A2', type: 'adj', conjugation: '', example: 'Das ist meine persönliche Meinung.', exampleMeaning: '這是我的個人意見。' },
{ word: 'gegen', article: '', plural: '', meaning: '反對；對著', englishMeaning: 'against; towards', level: 'A2', type: 'prep', conjugation: '', example: 'Ich bin gegen diese Idee.', exampleMeaning: '我反對這個想法。' },
{ word: 'ohne', article: '', plural: '', meaning: '沒有...', englishMeaning: 'without', level: 'A2', type: 'prep', conjugation: '', example: 'Ohne dich gehe ich nicht.', exampleMeaning: '沒有你我不會去。' },
{ word: 'durch', article: '', plural: '', meaning: '穿過；透過', englishMeaning: 'through', level: 'A2', type: 'prep', conjugation: '', example: 'Wir fahren durch den Tunnel.', exampleMeaning: '我們開車穿過隧道。' },
{ word: 'um', article: '', plural: '', meaning: '在...周圍；在...點', englishMeaning: 'around; at (time)', level: 'A2', type: 'prep', conjugation: '', example: 'Wir treffen uns um sieben Uhr.', exampleMeaning: '我們七點見面。' },
{ word: 'für', article: '', plural: '', meaning: '為了', englishMeaning: 'for', level: 'A2', type: 'prep', conjugation: '', example: 'Das Geschenk ist für dich.', exampleMeaning: '這個禮物是給你的。' },
{ word: 'ab', article: '', plural: '', meaning: '從...開始', englishMeaning: 'from (time/place)', level: 'A2', type: 'prep', conjugation: '', example: 'Der Zug fährt ab Köln.', exampleMeaning: '這輛火車從科隆出發。' },
{ word: 'seit', article: '', plural: '', meaning: '自從...', englishMeaning: 'since', level: 'A2', type: 'prep', conjugation: '', example: 'Ich lerne seit zwei Jahren Deutsch.', exampleMeaning: '我學德語已經兩年了。' },
{ word: 'bei', article: '', plural: '', meaning: '在...旁邊；在...處 (工作)', englishMeaning: 'near; at (company/person)', level: 'A2', type: 'prep', conjugation: '', example: 'Er arbeitet bei Siemens.', exampleMeaning: '他在西門子工作。' },
{ word: 'außer', article: '', plural: '', meaning: '除了...', englishMeaning: 'except for', level: 'A2', type: 'prep', conjugation: '', example: 'Alle außer mir sind schon da.', exampleMeaning: '除了我以外，所有人都已經到了。' },
{ word: 'bis', article: '', plural: '', meaning: '直到...', englishMeaning: 'until; to', level: 'A2', type: 'prep', conjugation: '', example: 'Ich warte bis morgen.', exampleMeaning: '我等到明天。' },
{ word: 'Kopfschmerz', article: 'der', plural: '-en', meaning: '頭痛', englishMeaning: 'headache', level: 'A2', type: 'noun', conjugation: '', example: 'Ich habe starke Kopfschmerzen.', exampleMeaning: '我頭痛得很厲害。' },
{ word: 'Halsweh', article: 'das', plural: '', meaning: '喉嚨痛', englishMeaning: 'sore throat', level: 'A2', type: 'noun', conjugation: '', example: 'Ich habe Halsweh und Fieber.', exampleMeaning: '我喉嚨痛並發燒。' },
{ word: 'Fieber', article: 'das', plural: '-', meaning: '發燒', englishMeaning: 'fever', level: 'A2', type: 'noun', conjugation: '', example: 'Das Kind hat hohes Fieber.', exampleMeaning: '這個孩子發高燒。' },
{ word: 'Husten', article: 'der', plural: '', meaning: '咳嗽', englishMeaning: 'cough', level: 'A2', type: 'noun', conjugation: '', example: 'Er hat seit Tagen Husten.', exampleMeaning: '他已經咳嗽好幾天了。' },
{ word: 'Schnupfen', article: 'der', plural: '', meaning: '流鼻水', englishMeaning: 'runny nose', level: 'A2', type: 'noun', conjugation: '', example: 'Ich habe Schnupfen und fühle mich erkältet.', exampleMeaning: '我流鼻水，感覺感冒了。' },
{ word: 'Arzttermin', article: 'der', plural: '-e', meaning: '看診預約', englishMeaning: 'doctor s appointment', level: 'A2', type: 'noun', conjugation: '', example: 'Ich habe einen Arzttermin um 10 Uhr.', exampleMeaning: '我十點有個看診預約。' },
{ word: 'Geschenk', article: 'das', plural: '-e', meaning: '禮物', englishMeaning: 'gift', level: 'A2', type: 'noun', conjugation: '', example: 'Ich habe ein Geschenk für dich gekauft.', exampleMeaning: '我為你買了一個禮物。' },
{ word: 'Geburtstag', article: 'der', plural: '-e', meaning: '生日', englishMeaning: 'birthday', level: 'A2', type: 'noun', conjugation: '', example: 'Wann hast du Geburtstag?', exampleMeaning: '你什麼時候生日？' },
{ word: 'Feier', article: 'die', plural: '-n', meaning: '慶祝活動', englishMeaning: 'celebration', level: 'A2', type: 'noun', conjugation: '', example: 'Wir machen eine große Feier.', exampleMeaning: '我們舉辦一個大型的慶祝活動。' },
{ word: 'Einladung', article: 'die', plural: '-en', meaning: '邀請函', englishMeaning: 'invitation', level: 'A2', type: 'noun', conjugation: '', example: 'Ich habe eine Einladung zur Hochzeit bekommen.', exampleMeaning: '我收到了婚禮邀請函。' },
{ word: 'Gast', article: 'der', plural: 'Gäste', meaning: '客人', englishMeaning: 'guest', level: 'A2', type: 'noun', conjugation: '', example: 'Es kommen viele Gäste zur Party.', exampleMeaning: '有很多客人會來參加派對。' },
{ word: 'Glückwunsch', article: 'der', plural: 'Glückwünsche', meaning: '祝賀', englishMeaning: 'congratulation', level: 'A2', type: 'noun', conjugation: '', example: 'Herzlichen Glückwunsch zum Geburtstag!', exampleMeaning: '衷心祝賀你生日快樂！' },
{ word: 'wünschen', article: '', plural: '', meaning: '祝福；希望', englishMeaning: 'to wish', level: 'A2', type: 'verb', conjugation: 'er wünscht, wünschte, hat gewünscht', example: 'Ich wünsche dir alles Gute.', exampleMeaning: '我祝福你一切順利。' },
{ word: 'feiern', article: '', plural: '', meaning: '慶祝', englishMeaning: 'to celebrate', level: 'A2', type: 'verb', conjugation: 'er feiert, feierte, hat gefeiert', example: 'Wir feiern Weihnachten bei uns.', exampleMeaning: '我們在家裡慶祝聖誕節。' },
{ word: 'einladen', article: '', plural: '', meaning: '邀請', englishMeaning: 'to invite', level: 'A2', type: 'verb', conjugation: 'er lädt ein, lud ein, hat eingeladen', example: 'Ich möchte dich zum Essen einladen.', exampleMeaning: '我想邀請你吃飯。' },
{ word: 'kennenlernen', article: '', plural: '', meaning: '認識', englishMeaning: 'to get to know', level: 'A2', type: 'verb', conjugation: 'er lernt kennen, lernte kennen, hat kennengelernt', example: 'Ich freue mich, dich kennenzulernen.', exampleMeaning: '我很高興認識你。' },
{ word: 'danken', article: '', plural: '', meaning: '感謝', englishMeaning: 'to thank', level: 'A2', type: 'verb', conjugation: 'er dankt, dankte, hat gedankt', example: 'Ich danke Ihnen für Ihre Hilfe.', exampleMeaning: '我感謝您的幫助。' },
{ word: 'entschuldigen', article: '', plural: '', meaning: '道歉', englishMeaning: 'to apologize', level: 'A2', type: 'verb', conjugation: 'er entschuldigt, entschuldigte, hat entschuldigt', example: 'Ich entschuldige mich für die Verspätung.', exampleMeaning: '我為遲到道歉。' },
{ word: 'Verständnis', article: 'das', plural: '', meaning: '理解', englishMeaning: 'understanding', level: 'A2', type: 'noun', conjugation: '', example: 'Vielen Dank für Ihr Verständnis.', exampleMeaning: '非常感謝您的理解。' },
{ word: 'Bitte', article: 'die', plural: '-n', meaning: '請求', englishMeaning: 'request', level: 'A2', type: 'noun', conjugation: '', example: 'Ich habe eine große Bitte an dich.', exampleMeaning: '我有一個大請求要找你。' },
{ word: 'Angebot', article: 'das', plural: '-e', meaning: '報價；特價', englishMeaning: 'offer; special deal', level: 'A2', type: 'noun', conjugation: '', example: 'Das ist ein gutes Angebot.', exampleMeaning: '這是一個很好的報價。' },
{ word: 'bestellen', article: '', plural: '', meaning: '點餐；訂購', englishMeaning: 'to order', level: 'A2', type: 'verb', conjugation: 'er bestellt, bestellte, hat bestellt', example: 'Was möchten Sie bestellen?', exampleMeaning: '您想點什麼？' },
{ word: 'reservieren', article: '', plural: '', meaning: '預訂', englishMeaning: 'to reserve', level: 'A2', type: 'verb', conjugation: 'er reserviert, reservierte, hat reserviert', example: 'Ich möchte einen Tisch reservieren.', exampleMeaning: '我想預訂一張桌子。' },
{ word: 'abholen', article: '', plural: '', meaning: '接送', englishMeaning: 'to pick up', level: 'A2', type: 'verb', conjugation: 'er holt ab, holte ab, hat abgeholt', example: 'Kannst du mich vom Bahnhof abholen?', exampleMeaning: '你可以從火車站接我嗎？' },
{ word: 'einsteigen', article: '', plural: '', meaning: '上車', englishMeaning: 'to board (a vehicle)', level: 'A2', type: 'verb', conjugation: 'er steigt ein, stieg ein, ist eingestiegen', example: 'Bitte alle einsteigen!', exampleMeaning: '請所有人都上車！' },
{ word: 'aussteigen', article: '', plural: '', meaning: '下車', englishMeaning: 'to get off (a vehicle)', level: 'A2', type: 'verb', conjugation: 'er steigt aus, stieg aus, ist ausgestiegen', example: 'Wir müssen hier aussteigen.', exampleMeaning: '我們必須在這裡下車。' },
{ word: 'umsteigen', article: '', plural: '', meaning: '轉車', englishMeaning: 'to change (transport)', level: 'A2', type: 'verb', conjugation: 'er steigt um, stieg um, ist umgestiegen', example: 'Sie müssen in Hamburg umsteigen.', exampleMeaning: '您必須在漢堡轉車。' },
{ word: 'Gepäck', article: 'das', plural: '', meaning: '行李', englishMeaning: 'luggage', level: 'A2', type: 'noun', conjugation: '', example: 'Ich habe viel Gepäck dabei.', exampleMeaning: '我帶了很多行李。' },
{ word: 'Fahrkarte', article: 'die', plural: '-n', meaning: '車票', englishMeaning: 'ticket', level: 'A2', type: 'noun', conjugation: '', example: 'Ich brauche eine Fahrkarte nach Berlin.', exampleMeaning: '我需要一張去柏林的車票。' },
{ word: 'Verspätung', article: 'die', plural: '-en', meaning: '延遲', englishMeaning: 'delay', level: 'A2', type: 'noun', conjugation: '', example: 'Der Zug hat 10 Minuten Verspätung.', exampleMeaning: '這輛火車延遲了十分鐘。' },
{ word: 'Flug', article: 'der', plural: 'Flüge', meaning: '航班', englishMeaning: 'flight', level: 'A2', type: 'noun', conjugation: '', example: 'Der Flug geht um 14 Uhr.', exampleMeaning: '這個航班在下午兩點。' },
{ word: 'Reise', article: 'die', plural: '-n', meaning: '旅行', englishMeaning: 'journey; trip', level: 'A2', type: 'noun', conjugation: '', example: 'Ich mache eine Reise nach Italien.', exampleMeaning: '我將去義大利旅行。' },
{ word: 'Urlaub', article: 'der', plural: '-e', meaning: '假期', englishMeaning: 'holiday; vacation', level: 'A2', type: 'noun', conjugation: '', example: 'Ich fahre in den Urlaub.', exampleMeaning: '我要去度假。' },
{ word: 'auspacken', article: '', plural: '', meaning: '打開包裹', englishMeaning: 'to unpack', level: 'A2', type: 'verb', conjugation: 'er packt aus, packte aus, hat ausgepackt', example: 'Ich muss meinen Koffer auspacken.', exampleMeaning: '我必須打開我的行李箱。' },
{ word: 'Miete', article: 'die', plural: '-n', meaning: '租金', englishMeaning: 'rent', level: 'A2', type: 'noun', conjugation: '', example: 'Die Miete für die Wohnung ist hoch.', exampleMeaning: '這間公寓的租金很高。' },
{ word: 'Nachbar', article: 'der', plural: '-n', meaning: '鄰居 (男)', englishMeaning: 'neighbor (male)', level: 'A2', type: 'noun', conjugation: '', example: 'Mein Nachbar ist sehr hilfsbereit.', exampleMeaning: '我的男鄰居很樂於助人。' },
{ word: 'Nachbarin', article: 'die', plural: '-nen', meaning: '鄰居 (女)', englishMeaning: 'neighbor (female)', level: 'A2', type: 'noun', conjugation: '', example: 'Sie kennt ihre Nachbarin gut.', exampleMeaning: '她很認識她的女鄰居。' },
{ word: 'Reparatur', article: 'die', plural: '-en', meaning: '修理', englishMeaning: 'repair', level: 'A2', type: 'noun', conjugation: '', example: 'Wir brauchen eine Reparatur in der Küche.', exampleMeaning: '我們廚房需要修理。' },
{ word: 'kaputt', article: '', plural: '', meaning: '壞掉的', englishMeaning: 'broken', level: 'A2', type: 'adj', conjugation: '', example: 'Mein Handy ist kaputt.', exampleMeaning: '我的手機壞了。' },
{ word: 'sauber', article: '', plural: '', meaning: '乾淨的', englishMeaning: 'clean', level: 'A2', type: 'adj', conjugation: '', example: 'Die Wohnung ist sehr sauber.', exampleMeaning: '這間公寓很乾淨。' },
{ word: 'dunkel', article: '', plural: '', meaning: '暗的', englishMeaning: 'dark', level: 'A2', type: 'adj', conjugation: '', example: 'Das Zimmer ist zu dunkel.', exampleMeaning: '這個房間太暗了。' },
{ word: 'hell', article: '', plural: '', meaning: '亮的', englishMeaning: 'bright', level: 'A2', type: 'adj', conjugation: '', example: 'Im Sommer ist es lange hell.', exampleMeaning: '夏天白天很長。' },
{ word: 'umziehen', article: '', plural: '', meaning: '搬家', englishMeaning: 'to move (house)', level: 'A2', type: 'verb', conjugation: 'er zieht um, zog um, ist umgezogen', example: 'Wir werden nächsten Monat umziehen.', exampleMeaning: '我們下個月要搬家。' },
{ word: 'melden', article: '', plural: '', meaning: '報告；報到', englishMeaning: 'to report; to register', level: 'A2', type: 'verb', conjugation: 'er meldet, meldete, hat gemeldet', example: 'Sie müssen sich beim Bürgeramt melden.', exampleMeaning: '您必須向市民辦公室報到。' },
{ word: 'unterschreiben', article: '', plural: '', meaning: '簽名', englishMeaning: 'to sign', level: 'A2', type: 'verb', conjugation: 'er unterschreibt, unterschrieb, hat unterschrieben', example: 'Bitte unterschreiben Sie hier.', exampleMeaning: '請在這裡簽名。' },
{ word: 'Formular', article: 'das', plural: '-e', meaning: '表格', englishMeaning: 'form', level: 'A2', type: 'noun', conjugation: '', example: 'Füllen Sie bitte dieses Formular aus.', exampleMeaning: '請填寫這份表格。' },
{ word: 'Konto', article: 'das', plural: 'Konten', meaning: '帳戶', englishMeaning: 'account', level: 'A2', type: 'noun', conjugation: '', example: 'Ich habe ein Konto bei dieser Bank.', exampleMeaning: '我在這間銀行有一個帳戶。' },
{ word: 'Geldautomat', article: 'der', plural: '-en', meaning: '提款機', englishMeaning: 'ATM', level: 'A2', type: 'noun', conjugation: '', example: 'Der Geldautomat ist außer Betrieb.', exampleMeaning: '提款機故障了。' },
{ word: 'überweisen', article: '', plural: '', meaning: '轉帳', englishMeaning: 'to transfer (money)', level: 'A2', type: 'verb', conjugation: 'er überweist, überwies, hat überwiesen', example: 'Ich muss Geld überweisen.', exampleMeaning: '我必須轉帳。' },
{ word: 'sparen', article: '', plural: '', meaning: '儲蓄', englishMeaning: 'to save (money)', level: 'A2', type: 'verb', conjugation: 'er spart, sparte, hat gespart', example: 'Ich spare für ein neues Auto.', exampleMeaning: '我在為一輛新車存錢。' },
{ word: 'reichen', article: '', plural: '', meaning: '足夠', englishMeaning: 'to be enough', level: 'A2', type: 'verb', conjugation: 'es reicht, reichte, hat gereicht', example: 'Reicht das Geld?', exampleMeaning: '這些錢夠嗎？' },
{ word: 'ehrlich', article: '', plural: '', meaning: '誠實的', englishMeaning: 'honest', level: 'A2', type: 'adj', conjugation: '', example: 'Ich bin immer ehrlich zu dir.', exampleMeaning: '我對你總是誠實的。' },
{ word: 'höflich', article: '', plural: '', meaning: '有禮貌的', englishMeaning: 'polite', level: 'A2', type: 'adj', conjugation: '', example: 'Er ist ein sehr höflicher Mann.', exampleMeaning: '他是一位非常有禮貌的男士。' },
{ word: 'unhöflich', article: '', plural: '', meaning: '不禮貌的', englishMeaning: 'impolite', level: 'A2', type: 'adj', conjugation: '', example: 'Sein Verhalten war unhöflich.', exampleMeaning: '他的行為是不禮貌的。' },
{ word: 'sicher', article: '', plural: '', meaning: '確定的；安全的', englishMeaning: 'sure; safe', level: 'A2', type: 'adj', conjugation: '', example: 'Bist du sicher?', exampleMeaning: '你確定嗎？' },
{ word: 'gefährlich', article: '', plural: '', meaning: '危險的', englishMeaning: 'dangerous', level: 'A2', type: 'adj', conjugation: '', example: 'Das ist ein gefährlicher Weg.', exampleMeaning: '這是一條危險的路。' },
{ word: 'frisch', article: '', plural: '', meaning: '新鮮的', englishMeaning: 'fresh', level: 'A2', type: 'adj', conjugation: '', example: 'Ich kaufe frisches Gemüse.', exampleMeaning: '我買新鮮的蔬菜。' },
{ word: 'trocken', article: '', plural: '', meaning: '乾燥的', englishMeaning: 'dry', level: 'A2', type: 'adj', conjugation: '', example: 'Die Wäsche ist schon trocken.', exampleMeaning: '衣服已經乾了。' },
{ word: 'nass', article: '', plural: '', meaning: '潮濕的', englishMeaning: 'wet', level: 'A2', type: 'adj', conjugation: '', example: 'Vorsicht, die Straße ist nass.', exampleMeaning: '小心，路面很濕。' },
{ word: 'gesund', article: '', plural: '', meaning: '健康的', englishMeaning: 'healthy', level: 'A2', type: 'adj', conjugation: '', example: 'Er lebt sehr gesund.', exampleMeaning: '他生活得很健康。' },
{ word: 'normal', article: '', plural: '', meaning: '正常的', englishMeaning: 'normal', level: 'A2', type: 'adj', conjugation: '', example: 'Das ist ganz normal.', exampleMeaning: '這是完全正常的。' },
{ word: 'anders', article: '', plural: '', meaning: '不同的', englishMeaning: 'different', level: 'A2', type: 'adj', conjugation: '', example: 'Ich sehe das anders.', exampleMeaning: '我對此有不同的看法。' },
{ word: 'gleich', article: '', plural: '', meaning: '相同的；馬上', englishMeaning: 'same; immediately', level: 'A2', type: 'adj', conjugation: '', example: 'Das ist das gleiche Problem.', exampleMeaning: '這是相同的問題。' },
{ word: 'leise', article: '', plural: '', meaning: '安靜地', englishMeaning: 'quietly', level: 'A2', type: 'adv', conjugation: '', example: 'Bitte sprich leise.', exampleMeaning: '請小聲說話。' },
{ word: 'laut', article: '', plural: '', meaning: '大聲地', englishMeaning: 'loudly', level: 'A2', type: 'adv', conjugation: '', example: 'Die Musik ist zu laut.', exampleMeaning: '音樂太吵了。' },
{ word: 'hinten', article: '', plural: '', meaning: '在後面', englishMeaning: 'at the back', level: 'A2', type: 'adv', conjugation: '', example: 'Das Bad ist ganz hinten.', exampleMeaning: '浴室在最後面。' },
{ word: 'vorn', article: '', plural: '', meaning: '在前面', englishMeaning: 'at the front', level: 'A2', type: 'adv', conjugation: '', example: 'Er sitzt vorn im Kino.', exampleMeaning: '他坐在電影院前面。' },
{ word: 'oben', article: '', plural: '', meaning: '在上面', englishMeaning: 'upstairs; above', level: 'A2', type: 'adv', conjugation: '', example: 'Ich wohne ganz oben.', exampleMeaning: '我住在最上面。' },
{ word: 'unten', article: '', plural: '', meaning: '在下面', englishMeaning: 'downstairs; below', level: 'A2', type: 'adv', conjugation: '', example: 'Die Küche ist unten.', exampleMeaning: '廚房在樓下。' },
{ word: 'außen', article: '', plural: '', meaning: '在外面', englishMeaning: 'outside', level: 'A2', type: 'adv', conjugation: '', example: 'Wir sitzen lieber außen.', exampleMeaning: '我們比較喜歡坐在外面。' },
{ word: 'innen', article: '', plural: '', meaning: '在裡面', englishMeaning: 'inside', level: 'A2', type: 'adv', conjugation: '', example: 'Es ist kalt, bleiben wir innen.', exampleMeaning: '很冷，我們待在裡面吧。' },
{ word: 'zuerst', article: '', plural: '', meaning: '首先', englishMeaning: 'first', level: 'A2', type: 'adv', conjugation: '', example: 'Zuerst essen wir, dann gehen wir.', exampleMeaning: '我們先吃飯，然後再走。' },
{ word: 'danach', article: '', plural: '', meaning: '之後', englishMeaning: 'afterwards', level: 'A2', type: 'adv', conjugation: '', example: 'Wir gehen ins Kino, und danach essen wir.', exampleMeaning: '我們先去看電影，然後吃飯。' },
{ word: 'schließlich', article: '', plural: '', meaning: '最終；畢竟', englishMeaning: 'finally; after all', level: 'A2', type: 'adv', conjugation: '', example: 'Schließlich haben wir gewonnen.', exampleMeaning: '最終我們贏了。' },
{ word: 'nebenan', article: '', plural: '', meaning: '在隔壁', englishMeaning: 'next door', level: 'A2', type: 'adv', conjugation: '', example: 'Er wohnt direkt nebenan.', exampleMeaning: '他就住在隔壁。' },
{ word: 'Ereignis', article: 'das', plural: '-se', meaning: '事件', englishMeaning: 'event', level: 'A2', type: 'noun', conjugation: '', example: 'Das war ein wichtiges Ereignis.', exampleMeaning: '這是一個重要的事件。' },
{ word: 'Erfahrung', article: 'die', plural: '-en', meaning: '經驗', englishMeaning: 'experience', level: 'A2', type: 'noun', conjugation: '', example: 'Ich habe viel Berufserfahrung.', exampleMeaning: '我有豐富的工作經驗。' },
{ word: 'Glück', article: 'das', plural: '', meaning: '幸運；幸福', englishMeaning: 'luck; happiness', level: 'A2', type: 'noun', conjugation: '', example: 'Ich wünsche dir viel Glück!', exampleMeaning: '我祝你一切好運！' },
{ word: 'Pech', article: 'das', plural: '', meaning: '倒楣', englishMeaning: 'bad luck', level: 'A2', type: 'noun', conjugation: '', example: 'Ich hatte heute Pech.', exampleMeaning: '我今天運氣很差。' },
{ word: 'Hoffnung', article: 'die', plural: '-en', meaning: '希望', englishMeaning: 'hope', level: 'A2', type: 'noun', conjugation: '', example: 'Ich habe die Hoffnung noch nicht aufgegeben.', exampleMeaning: '我還沒有放棄希望。' },
{ word: 'Angst', article: 'die', plural: 'Ängste', meaning: '害怕', englishMeaning: 'fear', level: 'A2', type: 'noun', conjugation: '', example: 'Sie hat Angst vor Hunden.', exampleMeaning: '她害怕狗。' },
{ word: 'trauen', article: '', plural: '', meaning: '信任', englishMeaning: 'to trust', level: 'A2', type: 'verb', conjugation: 'er traut, traute, hat getraut', example: 'Ich traue ihm nicht.', exampleMeaning: '我不信任他。' },
{ word: 'sich freuen', article: '', plural: '', meaning: '感到高興', englishMeaning: 'to be happy', level: 'A2', type: 'verb', conjugation: 'er freut sich, freute sich, hat sich gefreut', example: 'Ich freue mich auf das Wochenende.', exampleMeaning: '我期待著週末。' },
{ word: 'weinen', article: '', plural: '', meaning: '哭泣', englishMeaning: 'to cry', level: 'A2', type: 'verb', conjugation: 'er weint, weinte, hat geweint', example: 'Sie hat lange geweint.', exampleMeaning: '她哭了很久。' },
{ word: 'lachen', article: '', plural: '', meaning: '笑', englishMeaning: 'to laugh', level: 'A2', type: 'verb', conjugation: 'er lacht, lachte, hat gelacht', example: 'Warum lachst du so laut?', exampleMeaning: '你為什麼笑得這麼大聲？' },
{ word: 'lächeln', article: '', plural: '', meaning: '微笑', englishMeaning: 'to smile', level: 'A2', type: 'verb', conjugation: 'er lächelt, lächelte, hat gelächelt', example: 'Sie lächelt freundlich.', exampleMeaning: '她友善地微笑。' },
{ word: 'sich ärgern', article: '', plural: '', meaning: '生氣', englishMeaning: 'to be angry', level: 'A2', type: 'verb', conjugation: 'er ärgert sich, ärgerte sich, hat sich geärgert', example: 'Er ärgert sich über den Fehler.', exampleMeaning: '他為這個錯誤生氣。' },
{ word: 'sich wundern', article: '', plural: '', meaning: '感到驚訝', englishMeaning: 'to be surprised', level: 'A2', type: 'verb', conjugation: 'er wundert sich, wunderte sich, hat sich gewundert', example: 'Ich wundere mich über seine Reaktion.', exampleMeaning: '我對他的反應感到驚訝。' },
{ word: 'Wohnzimmer', article: 'das', plural: '-', meaning: '客廳', englishMeaning: 'living room', level: 'A2', type: 'noun', conjugation: '', example: 'Wir sitzen im Wohnzimmer und sehen fern.', exampleMeaning: '我們在客廳坐著看電視。' },
{ word: 'Schlafzimmer', article: 'das', plural: '-', meaning: '臥室', englishMeaning: 'bedroom', level: 'A2', type: 'noun', conjugation: '', example: 'Mein Schlafzimmer ist klein, aber gemütlich.', exampleMeaning: '我的臥室很小，但很舒適。' },
{ word: 'Arbeitszimmer', article: 'das', plural: '-', meaning: '書房；工作室', englishMeaning: 'study; office', level: 'A2', type: 'noun', conjugation: '', example: 'Ich arbeite von zu Hause in meinem Arbeitszimmer.', exampleMeaning: '我在家裡的書房工作。' },
{ word: 'Garten', article: 'der', plural: 'Gärten', meaning: '花園', englishMeaning: 'garden', level: 'A2', type: 'noun', conjugation: '', example: 'Im Sommer sitzen wir im Garten.', exampleMeaning: '夏天我們坐在花園裡。' },
{ word: 'Keller', article: 'der', plural: '-', meaning: '地下室', englishMeaning: 'cellar; basement', level: 'A2', type: 'noun', conjugation: '', example: 'Wir lagern die Getränke im Keller.', exampleMeaning: '我們把飲料儲存在地下室。' },
{ word: 'Haustier', article: 'das', plural: '-e', meaning: '寵物', englishMeaning: 'pet', level: 'A2', type: 'noun', conjugation: '', example: 'Haben Sie Haustiere?', exampleMeaning: '您有寵物嗎？' },
{ word: 'Umwelt', article: 'die', plural: '', meaning: '環境', englishMeaning: 'environment', level: 'A2', type: 'noun', conjugation: '', example: 'Wir müssen die Umwelt schützen.', exampleMeaning: '我們必須保護環境。' },
{ word: 'Müll', article: 'der', plural: '', meaning: '垃圾', englishMeaning: 'trash', level: 'A2', type: 'noun', conjugation: '', example: 'Wirf den Müll in den Mülleimer.', exampleMeaning: '把垃圾扔進垃圾桶。' },
{ word: 'Energie', article: 'die', plural: '-n', meaning: '能源', englishMeaning: 'energy', level: 'A2', type: 'noun', conjugation: '', example: 'Wir sollten Energie sparen.', exampleMeaning: '我們應該節省能源。' },
{ word: 'sparen', article: '', plural: '', meaning: '節省', englishMeaning: 'to save (resources)', level: 'A2', type: 'verb', conjugation: 'er spart, sparte, hat gespart', example: 'Bitte sparen Sie Wasser.', exampleMeaning: '請節省用水。' },
{ word: 'trennen', article: '', plural: '', meaning: '分離；分類', englishMeaning: 'to separate', level: 'A2', type: 'verb', conjugation: 'er trennt, trennte, hat getrennt', example: 'Wir müssen den Müll trennen.', exampleMeaning: '我們必須分類垃圾。' },
{ word: 'verwenden', article: '', plural: '', meaning: '使用', englishMeaning: 'to use', level: 'A2', type: 'verb', conjugation: 'er verwendet, verwendete, hat verwendet', example: 'Ich verwende eine wiederverwendbare Tasche.', exampleMeaning: '我使用一個可重複使用的袋子。' },
{ word: 'wiederverwenden', article: '', plural: '', meaning: '重複使用', englishMeaning: 'to reuse', level: 'A2', type: 'verb', conjugation: 'er verwendet wieder, verwendete wieder, hat wiederverwendet', example: 'Wir sollten Plastikflaschen wiederverwenden.', exampleMeaning: '我們應該重複使用塑膠瓶。' },
{ word: 'öffentlich', article: '', plural: '', meaning: '公共的', englishMeaning: 'public', level: 'A2', type: 'adj', conjugation: '', example: 'Ich fahre mit öffentlichen Verkehrsmitteln.', exampleMeaning: '我搭乘公共交通工具。' },
{ word: 'schnell', article: '', plural: '', meaning: '快速的', englishMeaning: 'fast', level: 'A2', type: 'adj', conjugation: '', example: 'Der Zug fährt sehr schnell.', exampleMeaning: '這輛火車開得很快。' },
{ word: 'langsam', article: '', plural: '', meaning: '慢的', englishMeaning: 'slow', level: 'A2', type: 'adj', conjugation: '', example: 'Bitte fahr langsamer!', exampleMeaning: '請開慢一點！' },
{ word: 'praktisch', article: '', plural: '', meaning: '實用的', englishMeaning: 'practical', level: 'A2', type: 'adj', conjugation: '', example: 'Diese Lösung ist sehr praktisch.', exampleMeaning: '這個解決方案非常實用。' },
{ word: 'bequem', article: '', plural: '', meaning: '舒服的', englishMeaning: 'comfortable', level: 'A2', type: 'adj', conjugation: '', example: 'Das Sofa ist sehr bequem.', exampleMeaning: '這個沙發很舒服。' },
{ word: 'unbequem', article: '', plural: '', meaning: '不舒服的', englishMeaning: 'uncomfortable', level: 'A2', type: 'adj', conjugation: '', example: 'Der Stuhl ist unbequem.', exampleMeaning: '這把椅子不舒服。' },
{ word: 'Geduld', article: 'die', plural: '', meaning: '耐心', englishMeaning: 'patience', level: 'A2', type: 'noun', conjugation: '', example: 'Hab bitte etwas Geduld.', exampleMeaning: '請耐心一點。' },
{ word: 'Hilfe', article: 'die', plural: '', meaning: '幫助', englishMeaning: 'help', level: 'A2', type: 'noun', conjugation: '', example: 'Vielen Dank für deine Hilfe.', exampleMeaning: '非常感謝你的幫助。' },
{ word: 'Rat', article: 'der', plural: 'Ratschläge', meaning: '建議', englishMeaning: 'advice', level: 'A2', type: 'noun', conjugation: '', example: 'Gib mir bitte einen guten Rat.', exampleMeaning: '請給我一個好建議。' },
{ word: 'Problem', article: 'das', plural: '-e', meaning: '問題', englishMeaning: 'problem', level: 'A2', type: 'noun', conjugation: '', example: 'Wir müssen das Problem lösen.', exampleMeaning: '我們必須解決這個問題。' },
{ word: 'Lösung', article: 'die', plural: '-en', meaning: '解決方案', englishMeaning: 'solution', level: 'A2', type: 'noun', conjugation: '', example: 'Hast du eine Lösung gefunden?', exampleMeaning: '你找到解決方案了嗎？' },
{ word: 'Fehler', article: 'der', plural: '-', meaning: '錯誤', englishMeaning: 'mistake', level: 'A2', type: 'noun', conjugation: '', example: 'Er macht viele Fehler beim Sprechen.', exampleMeaning: '他在說話時犯了很多錯誤。' },
{ word: 'richtig', article: '', plural: '', meaning: '正確的', englishMeaning: 'correct', level: 'A2', type: 'adj', conjugation: '', example: 'Die Antwort ist richtig.', exampleMeaning: '這個答案是正確的。' },
{ word: 'falsch', article: '', plural: '', meaning: '錯誤的', englishMeaning: 'wrong', level: 'A2', type: 'adj', conjugation: '', example: 'Das ist falsch, bitte korrigiere es.', exampleMeaning: '這是錯的，請糾正它。' },
{ word: 'zufrieden', article: '', plural: '', meaning: '滿意的', englishMeaning: 'satisfied', level: 'A2', type: 'adj', conjugation: '', example: 'Bist du mit der Arbeit zufrieden?', exampleMeaning: '你對這份工作滿意嗎？' },
{ word: 'unzufrieden', article: '', plural: '', meaning: '不滿意的', englishMeaning: 'dissatisfied', level: 'A2', type: 'adj', conjugation: '', example: 'Er ist mit seinem Gehalt unzufrieden.', exampleMeaning: '他對他的薪水不滿意。' },
{ word: 'freundlich', article: '', plural: '', meaning: '友善的', englishMeaning: 'friendly', level: 'A2', type: 'adj', conjugation: '', example: 'Die Verkäuferin war sehr freundlich.', exampleMeaning: '這位女店員非常友善。' },
{ word: 'böse', article: '', plural: '', meaning: '生氣的；邪惡的', englishMeaning: 'angry; evil', level: 'A2', type: 'adj', conjugation: '', example: 'Sei nicht böse auf mich.', exampleMeaning: '不要生我的氣。' },
{ word: 'wunderbar', article: '', plural: '', meaning: '美好的；奇妙的', englishMeaning: 'wonderful', level: 'A2', type: 'adj', conjugation: '', example: 'Das Wetter ist wunderbar.', exampleMeaning: '這天氣真是太美好了。' },
{ word: 'schrecklich', article: '', plural: '', meaning: '可怕的', englishMeaning: 'terrible', level: 'A2', type: 'adj', conjugation: '', example: 'Das war ein schrecklicher Tag.', exampleMeaning: '那是可怕的一天。' },
{ word: 'lecker', article: '', plural: '', meaning: '美味的', englishMeaning: 'delicious', level: 'A2', type: 'adj', conjugation: '', example: 'Das Essen schmeckt lecker.', exampleMeaning: '這食物很美味。' },
{ word: 'satt', article: '', plural: '', meaning: '飽的', englishMeaning: 'full (from eating)', level: 'A2', type: 'adj', conjugation: '', example: 'Ich bin satt, danke.', exampleMeaning: '我飽了，謝謝。' },
{ word: 'voll', article: '', plural: '', meaning: '滿的', englishMeaning: 'full', level: 'A2', type: 'adj', conjugation: '', example: 'Die Flasche ist voll Wasser.', exampleMeaning: '瓶子裡裝滿了水。' },
{ word: 'leer', article: '', plural: '', meaning: '空的', englishMeaning: 'empty', level: 'A2', type: 'adj', conjugation: '', example: 'Der Teller ist leer.', exampleMeaning: '盤子是空的。' },
{ word: 'kostenlos', article: '', plural: '', meaning: '免費的', englishMeaning: 'free of charge', level: 'A2', type: 'adj', conjugation: '', example: 'Der Eintritt ist kostenlos.', exampleMeaning: '入場是免費的。' },
{ word: 'einfach', article: '', plural: '', meaning: '簡單的', englishMeaning: 'simple; easy', level: 'A2', type: 'adj', conjugation: '', example: 'Die Aufgabe ist ganz einfach.', exampleMeaning: '這個任務非常簡單。' },
{ word: 'schwierig', article: '', plural: '', meaning: '困難的', englishMeaning: 'difficult', level: 'A2', type: 'adj', conjugation: '', example: 'Diese Frage ist schwierig.', exampleMeaning: '這個問題很困難。' },
{ word: 'gleichzeitig', article: '', plural: '', meaning: '同時地', englishMeaning: 'simultaneously', level: 'A2', type: 'adv', conjugation: '', example: 'Wir können nicht gleichzeitig reden.', exampleMeaning: '我們不能同時說話。' },
{ word: 'meistens', article: '', plural: '', meaning: '通常；大多數時候', englishMeaning: 'mostly', level: 'A2', type: 'adv', conjugation: '', example: 'Ich gehe meistens zu Fuß zur Arbeit.', exampleMeaning: '我通常走路去上班。' },
{ word: 'manchmal', article: '', plural: '', meaning: '有時候', englishMeaning: 'sometimes', level: 'A2', type: 'adv', conjugation: '', example: 'Manchmal fühle ich mich einsam.', exampleMeaning: '我有時候會感到孤單。' },
{ word: 'selten', article: '', plural: '', meaning: '很少', englishMeaning: 'rarely', level: 'A2', type: 'adv', conjugation: '', example: 'Ich gehe selten ins Kino.', exampleMeaning: '我很少去看電影。' },
{ word: 'nie', article: '', plural: '', meaning: '從不', englishMeaning: 'never', level: 'A2', type: 'adv', conjugation: '', example: 'Er isst nie Fleisch.', exampleMeaning: '他從不吃肉。' },
{ word: 'immer', article: '', plural: '', meaning: '總是', englishMeaning: 'always', level: 'A2', type: 'adv', conjugation: '', example: 'Sie ruft immer an.', exampleMeaning: '她總會打電話來。' },
{ word: 'normalerweise', article: '', plural: '', meaning: '通常情況下', englishMeaning: 'normally', level: 'A2', type: 'adv', conjugation: '', example: 'Normalerweise stehe ich früh auf.', exampleMeaning: '通常情況下我會早起。' },
{ word: 'besonders', article: '', plural: '', meaning: '特別是', englishMeaning: 'especially', level: 'A2', type: 'adv', conjugation: '', example: 'Ich mag besonders Schokolade.', exampleMeaning: '我特別喜歡巧克力。' },
{ word: 'genug', article: '', plural: '', meaning: '足夠的', englishMeaning: 'enough', level: 'A2', type: 'adv', conjugation: '', example: 'Habe ich genug Geld?', exampleMeaning: '我的錢夠嗎？' },
{ word: 'zu', article: '', plural: '', meaning: '太過', englishMeaning: 'too', level: 'A2', type: 'adv', conjugation: '', example: 'Das ist zu teuer.', exampleMeaning: '這太貴了。' },
{ word: 'etwa', article: '', plural: '', meaning: '大約', englishMeaning: 'about', level: 'A2', type: 'adv', conjugation: '', example: 'Der Flug dauert etwa drei Stunden.', exampleMeaning: '這個航班大約持續三小時。' },
{ word: 'fast', article: '', plural: '', meaning: '幾乎', englishMeaning: 'almost', level: 'A2', type: 'adv', conjugation: '', example: 'Ich bin fast fertig.', exampleMeaning: '我幾乎完成了。' },
{ word: 'sicher', article: '', plural: '', meaning: '確定的', englishMeaning: 'surely', level: 'A2', type: 'adv', conjugation: '', example: 'Sicher finden wir eine Lösung.', exampleMeaning: '我們一定會找到解決方案。' },
{ word: 'wahrscheinlich', article: '', plural: '', meaning: '可能地', englishMeaning: 'probably', level: 'A2', type: 'adv', conjugation: '', example: 'Wahrscheinlich kommt er später.', exampleMeaning: '他可能會晚點來。' },
{ word: 'vielleicht', article: '', plural: '', meaning: '或許', englishMeaning: 'maybe', level: 'A2', type: 'adv', conjugation: '', example: 'Vielleicht sehen wir uns morgen.', exampleMeaning: '或許我們明天見。' },
{ word: 'obwohl', article: '', plural: '', meaning: '儘管', englishMeaning: 'although', level: 'A2', type: 'conj', conjugation: '', example: 'Obwohl es kalt war, sind wir gegangen.', exampleMeaning: '儘管很冷，我們還是走了。' },
{ word: 'weil', article: '', plural: '', meaning: '因為 (從句)', englishMeaning: 'because (subordinate clause)', level: 'A2', type: 'conj', conjugation: '', example: 'Ich bin müde, weil ich lange gearbeitet habe.', exampleMeaning: '我很累，因為我工作了很久。' },
{ word: 'dass', article: '', plural: '', meaning: '說...', englishMeaning: 'that', level: 'A2', type: 'conj', conjugation: '', example: 'Ich hoffe, dass du kommst.', exampleMeaning: '我希望你能來。' },
{ word: 'wenn', article: '', plural: '', meaning: '如果；當...', englishMeaning: 'if; when', level: 'A2', type: 'conj', conjugation: '', example: 'Ruf mich an, wenn du Zeit hast.', exampleMeaning: '如果你有時間就打給我。' },
{ word: 'als', article: '', plural: '', meaning: '當...時 (過去單次)', englishMeaning: 'when (past single event)', level: 'A2', type: 'conj', conjugation: '', example: 'Als ich Kind war, war ich oft krank.', exampleMeaning: '當我是個孩子時，我經常生病。' },
{ word: 'bevor', article: '', plural: '', meaning: '在...之前', englishMeaning: 'before', level: 'A2', type: 'conj', conjugation: '', example: 'Ruf mich an, bevor du kommst.', exampleMeaning: '在你來之前打電話給我。' },
{ word: 'nachdem', article: '', plural: '', meaning: '在...之後', englishMeaning: 'after', level: 'A2', type: 'conj', conjugation: '', example: 'Nachdem ich gegessen hatte, ging ich spazieren.', exampleMeaning: '在我吃完飯後，我去散步了。' },
{ word: 'damit', article: '', plural: '', meaning: '為了 (目的)', englishMeaning: 'in order that', level: 'A2', type: 'conj', conjugation: '', example: 'Ich lerne Deutsch, damit ich in Deutschland arbeiten kann.', exampleMeaning: '我學德語是為了能在德國工作。' },
{ word: 'sobald', article: '', plural: '', meaning: '一...就...', englishMeaning: 'as soon as', level: 'A2', type: 'conj', conjugation: '', example: 'Ich rufe dich an, sobald ich ankomme.', exampleMeaning: '我一到就打電話給你。' }
];

// ==========================================
// 📚 內建單字庫：B1 等級
// ==========================================
const BUILT_IN_WORDS_B1 = [
  { word: 'verändern', article: '', plural: '', meaning: '改變', englishMeaning: 'to change (something)', level: 'B1', type: 'verb', conjugation: 'er verändert, veränderte, hat verändert', example: 'Ich möchte mein Leben verändern.', exampleMeaning: '我想改變我的生活。' },
  { word: 'sich entwickeln', article: '', plural: '', meaning: '發展；進化', englishMeaning: 'to develop', level: 'B1', type: 'verb', conjugation: 'er entwickelt sich, entwickelte sich, hat sich entwickelt', example: 'Die Situation hat sich gut entwickelt.', exampleMeaning: '情況發展得很好。' },
  { word: 'erreichen', article: '', plural: '', meaning: '達到；聯繫到', englishMeaning: 'to reach; to achieve', level: 'B1', type: 'verb', conjugation: 'er erreicht, erreichte, hat erreicht', example: 'Ich habe mein Ziel erreicht.', exampleMeaning: '我達到了我的目標。' },
  { word: 'gelingen', article: '', plural: '', meaning: '成功', englishMeaning: 'to succeed', level: 'B1', type: 'verb', conjugation: 'es gelingt, gelang, ist gelungen', example: 'Die Prüfung ist mir gelungen.', exampleMeaning: '我成功通過了考試。' },
  { word: 'scheitern', article: '', plural: '', meaning: '失敗', englishMeaning: 'to fail', level: 'B1', type: 'verb', conjugation: 'er scheitert, scheiterte, ist gescheitert', example: 'Der Versuch ist gescheitert.', exampleMeaning: '這個嘗試失敗了。' },
  { word: 'vorstellen', article: '', plural: '', meaning: '介紹；想像', englishMeaning: 'to introduce; to imagine', level: 'B1', type: 'verb', conjugation: 'er stellt vor, stellte vor, hat vorgestellt', example: 'Darf ich mich vorstellen?', exampleMeaning: '我可以自我介紹嗎？' },
  { word: 'sich beschweren', article: '', plural: '', meaning: '投訴', englishMeaning: 'to complain', level: 'B1', type: 'verb', conjugation: 'er beschwert sich, beschwerte sich, hat sich beschwert', example: 'Der Kunde hat sich beschwert.', exampleMeaning: '這位顧客投訴了。' },
  { word: 'leiden', article: '', plural: '', meaning: '受苦；遭受', englishMeaning: 'to suffer', level: 'B1', type: 'verb', conjugation: 'er leidet, litt, hat gelitten', example: 'Er leidet unter Schlafstörungen.', exampleMeaning: '他患有睡眠障礙。' },
  { word: 'pflegen', article: '', plural: '', meaning: '照顧', englishMeaning: 'to care for', level: 'B1', type: 'verb', conjugation: 'er pflegt, pflegte, hat gepflegt', example: 'Sie pflegt ihre kranke Mutter.', exampleMeaning: '她照顧她生病的母親。' },
  { word: 'unterscheiden', article: '', plural: '', meaning: '區分', englishMeaning: 'to distinguish', level: 'B1', type: 'verb', conjugation: 'er unterscheidet, unterschied, hat unterschieden', example: 'Ich kann die beiden nicht unterscheiden.', exampleMeaning: '我無法區分這兩者。' },
  { word: 'verbessern', article: '', plural: '', meaning: '改進', englishMeaning: 'to improve', level: 'B1', type: 'verb', conjugation: 'er verbessert, verbesserte, hat verbessert', example: 'Ich möchte mein Deutsch verbessern.', exampleMeaning: '我想改進我的德語。' },
  { word: 'beweisen', article: '', plural: '', meaning: '證明', englishMeaning: 'to prove', level: 'B1', type: 'verb', conjugation: 'er beweist, bewies, hat bewiesen', example: 'Kannst du deine Aussage beweisen?', exampleMeaning: '你能證明你的說法嗎？' },
  { word: 'erhalten', article: '', plural: '', meaning: '收到；維持', englishMeaning: 'to receive; to maintain', level: 'B1', type: 'verb', conjugation: 'er erhält, erhielt, hat erhalten', example: 'Ich habe eine E-Mail erhalten.', exampleMeaning: '我收到了一封電子郵件。' },
  { word: 'vermuten', article: '', plural: '', meaning: '猜測', englishMeaning: 'to suspect; to assume', level: 'B1', type: 'verb', conjugation: 'er vermutet, vermutete, hat vermutet', example: 'Ich vermute, dass er heute nicht kommt.', exampleMeaning: '我猜他今天不會來。' },
  { word: 'schätzen', article: '', plural: '', meaning: '估計；珍視', englishMeaning: 'to estimate; to value', level: 'B1', type: 'verb', conjugation: 'er schätzt, schätzte, hat geschätzt', example: 'Ich schätze Ihre Hilfe sehr.', exampleMeaning: '我非常珍視您的幫助。' },
  { word: 'Abhängigkeit', article: 'die', plural: '-en', meaning: '依賴性', englishMeaning: 'dependence', level: 'B1', type: 'noun', conjugation: '', example: 'Es gibt eine Abhängigkeit von Technologie.', exampleMeaning: '人們對科技存在一種依賴性。' },
  { word: 'Erfolg', article: 'der', plural: '-e', meaning: '成功', englishMeaning: 'success', level: 'B1', type: 'noun', conjugation: '', example: 'Ich wünsche dir viel Erfolg!', exampleMeaning: '我祝你成功！' },
  { word: 'Misserfolg', article: 'der', plural: '-e', meaning: '失敗', englishMeaning: 'failure', level: 'B1', type: 'noun', conjugation: '', example: 'Ein Misserfolg ist kein Weltuntergang.', exampleMeaning: '一次失敗不是世界末日。' },
  { word: 'Ziel', article: 'das', plural: '-e', meaning: '目標', englishMeaning: 'goal; aim', level: 'B1', type: 'noun', conjugation: '', example: 'Ich setze mir ein neues Ziel.', exampleMeaning: '我為自己設定了一個新目標。' },
  { word: 'Bedeutung', article: 'die', plural: '-en', meaning: '意義', englishMeaning: 'meaning; importance', level: 'B1', type: 'noun', conjugation: '', example: 'Das Wort hat eine doppelte Bedeutung.', exampleMeaning: '這個詞有雙重意義。' },
  { word: 'Möglichkeit', article: 'die', plural: '-en', meaning: '可能性', englishMeaning: 'possibility', level: 'B1', type: 'noun', conjugation: '', example: 'Gibt es eine andere Möglichkeit?', exampleMeaning: '還有其他的可能性嗎？' },
  { word: 'Tatsache', article: 'die', plural: '-n', meaning: '事實', englishMeaning: 'fact', level: 'B1', type: 'noun', conjugation: '', example: 'Das ist eine bekannte Tatsache.', exampleMeaning: '這是一個眾所周知的事實。' },
  { word: 'Wahrheit', article: 'die', plural: '-en', meaning: '真相', englishMeaning: 'truth', level: 'B1', type: 'noun', conjugation: '', example: 'Ich sage dir die ganze Wahrheit.', exampleMeaning: '我會告訴你全部真相。' },
  { word: 'Lüge', article: 'die', plural: '-n', meaning: '謊言', englishMeaning: 'lie', level: 'B1', type: 'noun', conjugation: '', example: 'Er hat eine Lüge erzählt.', exampleMeaning: '他說了一個謊言。' },
  { word: 'Versprechen', article: 'das', plural: '-', meaning: '承諾', englishMeaning: 'promise', level: 'B1', type: 'noun', conjugation: '', example: 'Er hält immer sein Versprechen.', exampleMeaning: '他總是遵守他的承諾。' },
  { word: 'Verhältnis', article: 'das', plural: '-se', meaning: '關係；比例', englishMeaning: 'relationship; ratio', level: 'B1', type: 'noun', conjugation: '', example: 'Sie haben ein gutes Verhältnis zueinander.', exampleMeaning: '他們彼此關係很好。' },
  { word: 'Zusammenhang', article: 'der', plural: 'Zusammenhänge', meaning: '關聯；背景', englishMeaning: 'connection; context', level: 'B1', type: 'noun', conjugation: '', example: 'Es gibt einen direkten Zusammenhang.', exampleMeaning: '這有一個直接的關聯。' },
  { word: 'Gefühl', article: 'das', plural: '-e', meaning: '感覺', englishMeaning: 'feeling', level: 'B1', type: 'noun', conjugation: '', example: 'Ich habe ein gutes Gefühl dabei.', exampleMeaning: '我對此有一個好的感覺。' },
  { word: 'Mut', article: 'der', plural: '', meaning: '勇氣', englishMeaning: 'courage', level: 'B1', type: 'noun', conjugation: '', example: 'Man braucht Mut, um das zu tun.', exampleMeaning: '需要勇氣才能做這件事。' },
  { word: 'Rücksicht', article: 'die', plural: '', meaning: '顧慮；體諒', englishMeaning: 'consideration', level: 'B1', type: 'noun', conjugation: '', example: 'Nimm Rücksicht auf andere.', exampleMeaning: '請體諒他人。' },
  { word: 'Gedanke', article: 'der', plural: '-n', meaning: '想法', englishMeaning: 'thought', level: 'B1', type: 'noun', conjugation: '', example: 'Das ist ein interessanter Gedanke.', exampleMeaning: '這是一個有趣的想法。' },
  { word: 'Lösung', article: 'die', plural: '-en', meaning: '解決方案', englishMeaning: 'solution', level: 'B1', type: 'noun', conjugation: '', example: 'Wir suchen nach einer Lösung.', exampleMeaning: '我們在尋找解決方案。' },
  { word: 'Aussage', article: 'die', plural: '-n', meaning: '陳述；聲明', englishMeaning: 'statement', level: 'B1', type: 'noun', conjugation: '', example: 'Seine Aussage ist nicht klar.', exampleMeaning: '他的陳述不清楚。' },
  { word: 'Gespräch', article: 'das', plural: '-e', meaning: '對話；談話', englishMeaning: 'conversation', level: 'B1', type: 'noun', conjugation: '', example: 'Wir hatten ein langes Gespräch.', exampleMeaning: '我們進行了一次很長的談話。' },
  { word: 'sich entscheiden', article: '', plural: '', meaning: '決定', englishMeaning: 'to decide', level: 'B1', type: 'verb', conjugation: 'er entscheidet sich, entschied sich, hat sich entschieden', example: 'Ich habe mich für diesen Beruf entschieden.', exampleMeaning: '我決定了這個職業。' },
  { word: 'überlegen', article: '', plural: '', meaning: '考慮', englishMeaning: 'to consider', level: 'B1', type: 'verb', conjugation: 'er überlegt, überlegte, hat überlegt', example: 'Ich muss mir das noch überlegen.', exampleMeaning: '我必須再考慮一下。' },
  { word: 'diskutieren', article: '', plural: '', meaning: '討論', englishMeaning: 'to discuss', level: 'B1', type: 'verb', conjugation: 'er diskutiert, diskutierte, hat diskutiert', example: 'Wir müssen das Thema diskutieren.', exampleMeaning: '我們必須討論這個主題。' },
  { word: 'schaffen', article: '', plural: '', meaning: '完成；創造', englishMeaning: 'to manage; to create', level: 'B1', type: 'verb', conjugation: 'er schafft, schuf, hat geschaffen', example: 'Er hat es geschafft, die Prüfung zu bestehen.', exampleMeaning: '他成功通過了考試。' },
  { word: 'ändern', article: '', plural: '', meaning: '改變', englishMeaning: 'to change', level: 'B1', type: 'verb', conjugation: 'er ändert, änderte, hat geändert', example: 'Er hat seine Meinung geändert.', exampleMeaning: '他改變了他的意見。' },
  { word: 'sich irren', article: '', plural: '', meaning: '犯錯', englishMeaning: 'to be wrong', level: 'B1', type: 'verb', conjugation: 'er irrt sich, irrte sich, hat sich geirrt', example: 'Ich habe mich geirrt, das tut mir leid.', exampleMeaning: '我錯了，我很抱歉。' },
  { word: 'entsprechend', article: '', plural: '', meaning: '相應的', englishMeaning: 'corresponding', level: 'B1', type: 'adj', conjugation: '', example: 'Er hat die entsprechenden Dokumente mitgebracht.', exampleMeaning: '他帶來了相應的文件。' },
  { word: 'üblich', article: '', plural: '', meaning: '通常的；慣常的', englishMeaning: 'usual; customary', level: 'B1', type: 'adj', conjugation: '', example: 'Das ist hier nicht üblich.', exampleMeaning: '這在這裡並不常見。' },
  { word: 'selbstverständlich', article: '', plural: '', meaning: '理所當然的', englishMeaning: 'of course; self-evident', level: 'B1', type: 'adj', conjugation: '', example: 'Das ist selbstverständlich, kein Problem.', exampleMeaning: '這是理所當然的，沒問題。' },
  { word: 'zweifeln', article: '', plural: '', meaning: '懷疑', englishMeaning: 'to doubt', level: 'B1', type: 'verb', conjugation: 'er zweifelt, zweifelte, hat gezweifelt', example: 'Ich zweifle an seiner Ehrlichkeit.', exampleMeaning: '我懷疑他的誠實。' },
  { word: 'beachten', article: '', plural: '', meaning: '注意；遵守', englishMeaning: 'to pay attention to; to observe', level: 'B1', type: 'verb', conjugation: 'er beachtet, beachtete, hat beachtet', example: 'Bitte beachten Sie die Regeln.', exampleMeaning: '請遵守規則。' },
  { word: 'sich konzentrieren', article: '', plural: '', meaning: '專心', englishMeaning: 'to concentrate', level: 'B1', type: 'verb', conjugation: 'er konzentriert sich, konzentrierte sich, hat sich konzentriert', example: 'Ich kann mich nicht konzentrieren.', exampleMeaning: '我無法專心。' },
  { word: 'vorhaben', article: '', plural: '', meaning: '打算', englishMeaning: 'to intend', level: 'B1', type: 'verb', conjugation: 'er hat vor, hatte vor, hat vorgehabt', example: 'Was hast du heute Abend vor?', exampleMeaning: '你今晚打算做什麼？' },
  { word: 'bestätigen', article: '', plural: '', meaning: '確認', englishMeaning: 'to confirm', level: 'B1', type: 'verb', conjugation: 'er bestätigt, bestätigte, hat bestätigt', example: 'Bitte bestätigen Sie Ihre Reservierung.', exampleMeaning: '請確認您的預訂。' },
  { word: 'annehmen', article: '', plural: '', meaning: '接受；假定', englishMeaning: 'to accept; to assume', level: 'B1', type: 'verb', conjugation: 'er nimmt an, nahm an, hat angenommen', example: 'Ich nehme die Einladung an.', exampleMeaning: '我接受這個邀請。' },
  { word: 'lehnen', article: '', plural: '', meaning: '拒絕', englishMeaning: 'to refuse', level: 'B1', type: 'verb', conjugation: 'er lehnt ab, lehnte ab, hat abgelehnt', example: 'Er hat das Angebot abgelehnt.', exampleMeaning: '他拒絕了這個報價。' },
  { word: 'zustimmen', article: '', plural: '', meaning: '同意', englishMeaning: 'to agree', level: 'B1', type: 'verb', conjugation: 'er stimmt zu, stimmte zu, hat zugestimmt', example: 'Ich stimme dir zu.', exampleMeaning: '我同意你。' },
  { word: 'widersprechen', article: '', plural: '', meaning: '反對', englishMeaning: 'to contradict', level: 'B1', type: 'verb', conjugation: 'er widerspricht, widersprach, hat widersprochen', example: 'Er widerspricht mir oft.', exampleMeaning: '他經常反對我。' },
  { word: 'behaupten', article: '', plural: '', meaning: '聲稱', englishMeaning: 'to claim', level: 'B1', type: 'verb', conjugation: 'er behauptet, behauptete, hat behauptet', example: 'Er behauptet, die Wahrheit zu kennen.', exampleMeaning: '他聲稱知道真相。' },
  { word: 'Grund', article: 'der', plural: 'Gründe', meaning: '原因', englishMeaning: 'reason', level: 'B1', type: 'noun', conjugation: '', example: 'Nenn mir den Grund dafür.', exampleMeaning: '告訴我這樣做的原因。' },
  { word: 'Ursache', article: 'die', plural: '-n', meaning: '起因；根源', englishMeaning: 'cause', level: 'B1', type: 'noun', conjugation: '', example: 'Die Ursache des Problems ist unklar.', exampleMeaning: '這個問題的起因不明。' },
  { word: 'Folge', article: 'die', plural: '-n', meaning: '後果', englishMeaning: 'consequence', level: 'B1', type: 'noun', conjugation: '', example: 'Das hat schlimme Folgen.', exampleMeaning: '這會帶來嚴重的後果。' },
  { word: 'dadurch', article: '', plural: '', meaning: '因此；藉由', englishMeaning: 'thereby; by that', level: 'B1', type: 'adv', conjugation: '', example: 'Er hat gut gelernt, dadurch hat er die Prüfung bestanden.', exampleMeaning: '他學習得很好，因此通過了考試。' },
  { word: 'trotz', article: '', plural: '', meaning: '儘管', englishMeaning: 'despite', level: 'B1', type: 'prep', conjugation: '', example: 'Trotz des schlechten Wetters gehen wir spazieren.', exampleMeaning: '儘管天氣不好，我們還是去散步。' },
  { word: 'wegen', article: '', plural: '', meaning: '因為', englishMeaning: 'because of', level: 'B1', type: 'prep', conjugation: '', example: 'Wegen des Regens fällt das Konzert aus.', exampleMeaning: '因為下雨，音樂會取消了。' },
  { word: 'anstatt', article: '', plural: '', meaning: '取代', englishMeaning: 'instead of', level: 'B1', type: 'prep', conjugation: '', example: 'Anstatt zu arbeiten, spielt er.', exampleMeaning: '他沒有工作，而是在玩。' },
  { word: 'während', article: '', plural: '', meaning: '在...期間', englishMeaning: 'during; while', level: 'B1', type: 'prep', conjugation: '', example: 'Während des Films war ich müde.', exampleMeaning: '在電影期間我很累。' },
  { word: 'außerhalb', article: '', plural: '', meaning: '在...之外', englishMeaning: 'outside of', level: 'B1', type: 'prep', conjugation: '', example: 'Das Geschäft liegt außerhalb der Stadt.', exampleMeaning: '這間店位於城市之外。' },
  { word: 'innerhalb', article: '', plural: '', meaning: '在...之內', englishMeaning: ' inside of; within', level: 'B1', type: 'prep', conjugation: '', example: 'Die Lieferung erfolgt innerhalb einer Woche.', exampleMeaning: '貨物將在一週內送達。' },
  { word: 'gemäß', article: '', plural: '', meaning: '按照', englishMeaning: 'according to', level: 'B1', type: 'prep', conjugation: '', example: 'Gemäß der Regel ist das verboten.', exampleMeaning: '根據規定，這是被禁止的。' },
  { word: 'einschließlich', article: '', plural: '', meaning: '包含', englishMeaning: 'including', level: 'B1', type: 'prep', conjugation: '', example: 'Die Kosten, einschließlich Steuern, sind hoch.', exampleMeaning: '費用，包括稅金，都很高。' },
  { word: 'mithilfe', article: '', plural: '', meaning: '藉助', englishMeaning: 'with the help of', level: 'B1', type: 'prep', conjugation: '', example: 'Mithilfe von Freunden habe ich es geschafft.', exampleMeaning: '藉助朋友的幫助，我成功了。' },
  { word: 'gegenüber', article: '', plural: '', meaning: '在對面；相較於', englishMeaning: 'opposite; compared to', level: 'B1', type: 'prep', conjugation: '', example: 'Das Kino ist gegenüber der Post.', exampleMeaning: '電影院在郵局對面。' },
  { word: 'außerdem', article: '', plural: '', meaning: '此外', englishMeaning: 'besides; moreover', level: 'B1', type: 'adv', conjugation: '', example: 'Außerdem spreche ich Spanisch.', exampleMeaning: '此外，我還會說西班牙語。' },
  { word: 'sogar', article: '', plural: '', meaning: '甚至', englishMeaning: 'even', level: 'B1', type: 'adv', conjugation: '', example: 'Er kann sogar fließend Deutsch sprechen.', exampleMeaning: '他甚至能說流利的德語。' },
  { word: 'trotzdem', article: '', plural: '', meaning: '儘管如此', englishMeaning: 'nevertheless', level: 'B1', type: 'adv', conjugation: '', example: 'Es ist teuer, trotzdem kaufe ich es.', exampleMeaning: '雖然很貴，但我還是買了它。' },
  { word: 'kaum', article: '', plural: '', meaning: '幾乎不', englishMeaning: 'hardly', level: 'B1', type: 'adv', conjugation: '', example: 'Ich habe kaum geschlafen.', exampleMeaning: '我幾乎沒有睡覺。' },
  { word: 'eigentlich', article: '', plural: '', meaning: '實際上', englishMeaning: 'actually', level: 'B1', type: 'adv', conjugation: '', example: 'Eigentlich wollte ich zu Hause bleiben.', exampleMeaning: '實際上，我本來想待在家。' },
  { word: 'angeblich', article: '', plural: '', meaning: '據說', englishMeaning: 'allegedly', level: 'B1', type: 'adv', conjugation: '', example: 'Angeblich ist er krank.', exampleMeaning: '據說他生病了。' },
  { word: 'entweder...oder', article: '', plural: '', meaning: '或者...或者...', englishMeaning: 'either...or', level: 'B1', type: 'conj', conjugation: '', example: 'Entweder wir gehen ins Kino oder ins Theater.', exampleMeaning: '我們要麼去看電影，要麼去看戲劇。' },
  { word: 'weder...noch', article: '', plural: '', meaning: '既不...也不...', englishMeaning: 'neither...nor', level: 'B1', type: 'conj', conjugation: '', example: 'Er mag weder Kaffee noch Tee.', exampleMeaning: '他既不喜歡咖啡也不喜歡茶。' },
  { word: 'je...desto', article: '', plural: '', meaning: '越...就越...', englishMeaning: 'the more...the more', level: 'B1', type: 'conj', conjugation: '', example: 'Je mehr du lernst, desto besser wird dein Deutsch.', exampleMeaning: '你學得越多，你的德語就會越好。' },
  { word: 'damit', article: '', plural: '', meaning: '以便於', englishMeaning: 'so that (purpose)', level: 'B1', type: 'conj', conjugation: '', example: 'Er spricht langsam, damit ich ihn verstehe.', exampleMeaning: '他說話很慢，以便我能聽懂他。' },
  { word: 'ohne dass', article: '', plural: '', meaning: '沒有...', englishMeaning: 'without that', level: 'B1', type: 'conj', conjugation: '', example: 'Er ging, ohne dass ich es bemerkte.', exampleMeaning: '他走了，而我沒有注意到。' },
  { word: 'statt dass', article: '', plural: '', meaning: '而不是', englishMeaning: 'instead of', level: 'B1', type: 'conj', conjugation: '', example: 'Sie blieb zu Hause, statt dass sie zur Party ging.', exampleMeaning: '她待在家裡，而不是去參加派對。' },
  { word: 'sofern', article: '', plural: '', meaning: '只要', englishMeaning: 'as long as; provided that', level: 'B1', type: 'conj', conjugation: '', example: 'Ich helfe dir, sofern ich Zeit habe.', exampleMeaning: '只要我有時間，我就會幫你。' },
  { word: 'vorausgesetzt', article: '', plural: '', meaning: '假設', englishMeaning: 'provided that', level: 'B1', type: 'conj', conjugation: '', example: 'Vorausgesetzt, das Wetter ist gut, fahren wir morgen.', exampleMeaning: '假設天氣好，我們明天就出發。' },
  { word: 'Absicht', article: 'die', plural: '-en', meaning: '意圖', englishMeaning: 'intention', level: 'B1', type: 'noun', conjugation: '', example: 'Das war nicht meine Absicht.', exampleMeaning: '那不是我的本意。' },
  { word: 'Entscheidung', article: 'die', plural: '-en', meaning: '決定', englishMeaning: 'decision', level: 'B1', type: 'noun', conjugation: '', example: 'Er hat eine wichtige Entscheidung getroffen.', exampleMeaning: '他做了一個重要的決定。' },
  { word: 'Einblick', article: 'der', plural: '-e', meaning: '了解；洞察', englishMeaning: 'insight', level: 'B1', type: 'noun', conjugation: '', example: 'Das Buch gibt einen Einblick in die Kultur.', exampleMeaning: '這本書提供了對文化的了解。' },
  { word: 'Vermutung', article: 'die', plural: '-en', meaning: '猜測', englishMeaning: 'assumption', level: 'B1', type: 'noun', conjugation: '', example: 'Das ist nur eine Vermutung.', exampleMeaning: '這只是一個猜測。' },
  { word: 'Lernen', article: 'das', plural: '', meaning: '學習', englishMeaning: 'learning', level: 'B1', type: 'noun', conjugation: '', example: 'Das Lernen neuer Sprachen ist wichtig.', exampleMeaning: '學習新的語言是很重要的。' },
  { word: 'Wissen', article: 'das', plural: '', meaning: '知識', englishMeaning: 'knowledge', level: 'B1', type: 'noun', conjugation: '', example: 'Sein Wissen ist sehr groß.', exampleMeaning: '他的知識非常淵博。' },
  { word: 'Kenntnis', article: 'die', plural: '-se', meaning: '知識；認識', englishMeaning: 'knowledge (plural usually)', level: 'B1', type: 'noun', conjugation: '', example: 'Er hat gute Kenntnisse in Physik.', exampleMeaning: '他對物理學有很好的知識。' },
  { word: 'Fähigkeit', article: 'die', plural: '-en', meaning: '能力', englishMeaning: 'ability', level: 'B1', type: 'noun', conjugation: '', example: 'Sie hat die Fähigkeit, schnell zu lernen.', exampleMeaning: '她有快速學習的能力。' },
  { word: 'Erinnerung', article: 'die', plural: '-en', meaning: '記憶；回憶', englishMeaning: 'memory; recollection', level: 'B1', type: 'noun', conjugation: '', example: 'Ich habe gute Erinnerungen an die Zeit.', exampleMeaning: '我對那段時間有美好的回憶。' },
  { word: 'sich erinnern', article: '', plural: '', meaning: '回憶', englishMeaning: 'to remember', level: 'B1', type: 'verb', conjugation: 'er erinnert sich, erinnerte sich, hat sich erinnert', example: 'Er erinnert sich an seinen Urlaub.', exampleMeaning: '他回憶起他的假期。' },
  { word: 'vergessen', article: '', plural: '', meaning: '忘記', englishMeaning: 'to forget', level: 'B1', type: 'verb', conjugation: 'er vergisst, vergaß, hat vergessen', example: 'Ich habe deinen Namen vergessen.', exampleMeaning: '我忘記你的名字了。' },
  { word: 'verstehen', article: '', plural: '', meaning: '理解', englishMeaning: 'to understand', level: 'B1', type: 'verb', conjugation: 'er versteht, verstand, hat verstanden', example: 'Ich kann dich gut verstehen.', exampleMeaning: '我能很好地理解你。' },
  { word: 'lernen', article: '', plural: '', meaning: '學習', englishMeaning: 'to learn', level: 'B1', type: 'verb', conjugation: 'er lernt, lernte, hat gelernt', example: 'Wir lernen jeden Tag neue Wörter.', exampleMeaning: '我們每天都在學新單字。' },
  { word: 'lehren', article: '', plural: '', meaning: '教導', englishMeaning: 'to teach', level: 'B1', type: 'verb', conjugation: 'er lehrt, lehrte, hat gelehrt', example: 'Er lehrt uns die deutsche Grammatik.', exampleMeaning: '他教我們德語文法。' },
  { word: 'auswendig', article: '', plural: '', meaning: '背誦', englishMeaning: 'by heart', level: 'B1', type: 'adv', conjugation: '', example: 'Ich lerne die Vokabeln auswendig.', exampleMeaning: '我背誦這些單字。' },
  { word: 'schriftlich', article: '', plural: '', meaning: '書面的', englishMeaning: 'written', level: 'B1', type: 'adj', conjugation: '', example: 'Die Prüfung ist schriftlich.', exampleMeaning: '這個考試是筆試。' },
  { word: 'mündlich', article: '', plural: '', meaning: '口頭的', englishMeaning: 'oral', level: 'B1', type: 'adj', conjugation: '', example: 'Wir haben eine mündliche Prüfung.', exampleMeaning: '我們有一個口試。' },
  { word: 'klar', article: '', plural: '', meaning: '清楚的', englishMeaning: ' clear', level: 'B1', type: 'adj', conjugation: '', example: 'Ist das klar?', exampleMeaning: '這清楚了嗎？' },
  { word: 'deutlich', article: '', plural: '', meaning: '明確的', englishMeaning: 'distinct', level: 'B1', type: 'adj', conjugation: '', example: 'Bitte sprechen Sie deutlicher.', exampleMeaning: '請說得更明確一點。' },
  { word: 'kompliziert', article: '', plural: '', meaning: '複雜的', englishMeaning: 'complicated', level: 'B1', type: 'adj', conjugation: '', example: 'Das ist eine komplizierte Sache.', exampleMeaning: '這是一件複雜的事情。' }
];
// ==========================================

// 初始化 Firebase
let app, auth, db;
try {
  if (firebaseConfig.projectId) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch (e) {
  console.error("Firebase 初始化失敗", e);
}

// --- 統一取得 API Key 的邏輯 ---
const getEffectiveApiKey = () => {
  const localKey = localStorage.getItem('gemini_api_key');
  if (localKey && localKey.length > 10) return localKey;
  if (GEMINI_API_KEY && GEMINI_API_KEY.length > 10) return GEMINI_API_KEY.trim();
  return "";
};

// --- 全域變數：快取可用的模型名稱 ---
let cachedModelName = localStorage.getItem('gemini_preferred_model');

// --- 核心 AI 呼叫函式 ---
const callGeminiAI = async (prompt) => {
  const apiKey = getEffectiveApiKey();
  if (!apiKey) throw new Error("API Key 未設定");

  if (!cachedModelName) {
    try {
      const listResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      const listData = await listResponse.json();
      
      if (!listResponse.ok) {
        cachedModelName = 'gemini-1.5-flash';
      } else {
        const availableModels = listData.models
          ?.filter(m => m.name.includes('gemini') && m.supportedGenerationMethods?.includes('generateContent'))
          ?.map(m => m.name.replace('models/', ''));
        
        if (availableModels?.length > 0) {
          cachedModelName = availableModels.find(m => m.includes('2.5-flash')) || 
                            availableModels.find(m => m.includes('2.0-flash')) || 
                            availableModels.find(m => m.includes('flash')) || 
                            availableModels[0];
          localStorage.setItem('gemini_preferred_model', cachedModelName);
        } else {
          cachedModelName = 'gemini-1.5-flash';
        }
      }
    } catch (e) {
      cachedModelName = 'gemini-1.5-flash';
    }
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${cachedModelName}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: cachedModelName.includes('flash') || cachedModelName.includes('1.5') 
          ? { responseMimeType: "application/json" } 
          : undefined
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.error?.message || response.statusText;
      if (errorMsg.includes("responseMimeType") || response.status === 400) {
        return await callGeminiAI_TextMode(prompt, cachedModelName, apiKey);
      }
      if (response.status === 404) {
        cachedModelName = null; 
        localStorage.removeItem('gemini_preferred_model');
      }
      throw new Error(`模型 ${cachedModelName} 錯誤: ${errorMsg}`);
    }
    return data;
  } catch (e) {
    throw e;
  }
};

const callGeminiAI_TextMode = async (prompt, model, apiKey) => {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || response.statusText);
  return data;
};

// --- 設定 Modal ---
const SettingsModal = ({ isOpen, onClose }) => {
  const [key, setKey] = useState('');
  const [diagStatus, setDiagStatus] = useState('idle');
  const [diagResult, setDiagResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setKey(localStorage.getItem('gemini_api_key') || (GEMINI_API_KEY || ''));
      setDiagStatus('idle');
      setDiagResult(null);
    }
  }, [isOpen]);

  const handleSave = () => {
    const cleanKey = key.trim();
    if (cleanKey) {
      localStorage.setItem('gemini_api_key', cleanKey);
      cachedModelName = null;
      localStorage.removeItem('gemini_preferred_model');
      setDiagStatus('success');
      setDiagResult({ message: "設定已儲存，下次操作將重新偵測最佳模型。" });
      setTimeout(() => { onClose(); }, 1500);
    } else {
      localStorage.removeItem('gemini_api_key');
      onClose();
    }
  };

  const runDiagnosis = async () => {
    setDiagStatus('loading');
    setDiagResult(null);
    const testKey = key.trim();
    if (!testKey) { setDiagStatus('error'); setDiagResult({ error: "請先輸入 API Key" }); return; }

    try {
      const listResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${testKey}`);
      const listData = await listResponse.json();
      if (!listResponse.ok) throw new Error(listData.error?.message || `無法取得模型清單: ${listResponse.status}`);

      const models = listData.models?.filter(m => m.name.includes('gemini'))?.map(m => m.name.replace('models/', ''));
      let testModel = 'gemini-1.5-flash';
      if (models?.length > 0) testModel = models.find(m => m.includes('2.5-flash')) || models.find(m => m.includes('flash')) || models[0];
      
      const genResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${testModel}:generateContent?key=${testKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: "Hi" }] }] })
      });
      const genData = await genResponse.json();
      if (!genResponse.ok) throw new Error(`模型 ${testModel} 生成失敗: ${genData.error?.message}`);

      setDiagStatus('success');
      setDiagResult({ message: "診斷成功！", availableModels: models, testedModel: testModel });
    } catch (e) {
      setDiagStatus('error');
      setDiagResult({ error: e.message });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white">
          <h3 className="font-bold text-lg flex items-center gap-2"><Settings size={20}/> 系統設定與診斷</h3>
          <button onClick={onClose}><X size={20}/></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Google Gemini API Key</label>
            <input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="AIza..." className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 outline-none font-mono text-sm" />
            
            {diagResult && (
              <div className={`mt-2 p-2 rounded text-xs flex items-start gap-2 ${diagStatus === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                {diagStatus === 'testing' && <Loader2 size={14} className="animate-spin mt-0.5"/>}
                <span className="break-all">{diagResult?.message || diagResult?.error}</span>
              </div>
            )}
            {diagStatus === 'success' && diagResult?.availableModels && (
               <div className="max-h-24 overflow-y-auto bg-white border border-green-200 p-1.5 rounded font-mono text-[10px] leading-tight mt-2">
                  {diagResult.availableModels.map(m => <div key={m} className={m === diagResult.testedModel ? 'text-purple-600 font-bold' : ''}>{m} {m === diagResult.testedModel && '(自動選用)'}</div>)}
               </div>
            )}
          </div>
          <div className="flex justify-between pt-2">
            <button onClick={runDiagnosis} disabled={diagStatus === 'loading'} className="px-3 py-2 rounded text-slate-600 border border-slate-300 hover:bg-slate-50 text-sm flex items-center gap-2"><Zap size={16}/> 測試連線</button>
            <button onClick={handleSave} className="px-4 py-2 rounded text-white flex items-center gap-2 bg-slate-900 hover:bg-slate-800"><Save size={18}/> 儲存設定</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 使用者下拉選單元件 ---
const UserMenu = ({ user, onLogout, onImportLibrary, onDownload, onSettings }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full border border-slate-200"/>
        ) : (
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
            <User size={18} />
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
             <p className="text-xs text-slate-500 font-medium">已登入為</p>
             <p className="text-sm font-bold text-slate-800 truncate">{user.displayName || user.email}</p>
          </div>
          
          <div className="p-1">
            <button onClick={() => { onImportLibrary(); setIsOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2">
              <Library size={16} className="text-purple-500" /> 匯入內建題庫
            </button>
            <button onClick={() => { onDownload(); setIsOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2">
              <Download size={16} className="text-blue-500" /> 匯出備份
            </button>
            <button onClick={() => { onSettings(); setIsOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2">
              <Settings size={16} className="text-slate-500" /> API 設定
            </button>
          </div>

          <div className="border-t border-slate-100 p-1">
            <button onClick={onLogout} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2">
              <LogOut size={16} /> 登出
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- LoginScreen ---
const LoginScreen = ({ onLogin, onRedirectLogin, error, errorCode }) => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-100">
      <div className="bg-yellow-400 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-yellow-200 transform -rotate-6"><BookOpen size={40} className="text-slate-900" /></div>
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Deutsch Lernen</h1>
      <p className="text-slate-500 mb-8">您的雲端德語單字本</p>
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm mb-6 text-left border border-red-100">
          <div className="flex items-center gap-2 font-bold mb-1"><AlertCircle size={16}/><span>登入遇到問題</span></div>
          <p>{error}</p>
          {errorCode === 'auth/popup-blocked' && <div className="mt-2"><button onClick={onRedirectLogin} className="w-full bg-purple-600 text-white text-xs py-2 rounded flex justify-center gap-2"><LogIn size={14}/> 改用跳轉登入</button></div>}
        </div>
      )}
      <button onClick={onLogin} className="w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-3 px-4 rounded-xl flex justify-center gap-3 shadow-sm transition-colors"><span className="font-bold text-blue-600 mr-2">G</span> 使用 Google 帳號登入</button>
    </div>
  </div>
);

const FilterChip = ({ label, isSelected, onClick, colorClass = "bg-slate-900 text-white" }) => (
  <button onClick={onClick} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all h-8 flex items-center ${isSelected ? `${colorClass} border-transparent shadow` : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"}`}>{label}</button>
);

// --- 筆記編輯 Modal ---
const NoteModal = ({ isOpen, onClose, note, onSave }) => {
  const [content, setContent] = useState('');

  useEffect(() => {
    if (isOpen) setContent(note || '');
  }, [isOpen, note]);

  const handleSave = () => {
    onSave(content);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white">
          <h3 className="font-bold text-lg flex items-center gap-2"><NotebookPen size={20}/> 編輯筆記</h3>
          <button onClick={onClose}><X size={20}/></button>
        </div>
        <div className="p-6">
          <textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="在這裡輸入筆記..."
            className="w-full h-32 p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none text-slate-700"
          />
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">取消</button>
            <button onClick={handleSave} className="px-4 py-2 bg-slate-900 text-white rounded hover:bg-slate-800 flex items-center gap-2"><Save size={18}/> 儲存</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 內建題庫匯入 Modal (新增) ---
const LibraryModal = ({ isOpen, onClose, onImport }) => {
  if (!isOpen) return null;

  const libraries = [
    { level: 'A1', name: '初級單字庫', data: BUILT_IN_WORDS_A1, color: 'bg-emerald-100 text-emerald-800' },
    { level: 'A2', name: '基礎單字庫', data: BUILT_IN_WORDS_A2, color: 'bg-blue-100 text-blue-800' },
    { level: 'B1', name: '進階單字庫', data: BUILT_IN_WORDS_B1, color: 'bg-purple-100 text-purple-800' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white">
          <h3 className="font-bold text-lg flex items-center gap-2"><Library size={20}/> 內建題庫中心</h3>
          <button onClick={onClose}><X size={20}/></button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-500">請選擇您想要匯入的單字等級：</p>
          <div className="space-y-3">
            {libraries.map((lib) => (
              <button 
                key={lib.level}
                onClick={() => { onImport(lib.data); onClose(); }}
                disabled={lib.data.length === 0}
                className={`w-full p-4 rounded-xl border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all flex items-center justify-between group ${lib.data.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${lib.color}`}>
                    {lib.level}
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-slate-800 group-hover:text-purple-700">{lib.name}</h4>
                    <p className="text-xs text-slate-500">{lib.data.length} 個單字</p>
                  </div>
                </div>
                <ArrowRight size={20} className="text-slate-300 group-hover:text-purple-500" />
              </button>
            ))}
          </div>
          <div className="text-xs text-center text-slate-400 mt-4 border-t pt-4">
            匯入時系統會自動略過您已經擁有的單字。
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 單字卡元件 ---
const VocabularyCard = ({ item, onToggleStatus, onDelete, onEditNote, onEditCard, isBatchMode, isSelected, onSelect }) => {
  const [isNoteExpanded, setIsNoteExpanded] = useState(false);

  const handleSpeak = (text, e) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.lang = 'de-DE'; utterance.rate = 0.9; window.speechSynthesis.speak(utterance); }
  };
  const getCardStyle = () => { 
    if (item.status === 'learned') return 'bg-emerald-50 border-emerald-200'; 
    if (item.status === 'review') return 'bg-amber-50 border-amber-200'; 
    return 'bg-white border-gray-200'; 
  };
  const getTypeBadgeColor = () => { 
    if (item.type === 'noun') return 'bg-blue-100 text-blue-700'; 
    if (item.type === 'verb') return 'bg-purple-100 text-purple-700'; 
    if (item.type === 'adj') return 'bg-yellow-100 text-yellow-700'; 
    return 'bg-gray-100 text-gray-700'; 
  };
  
  const isBuiltIn = item.source === 'builtin';
  const SourceIcon = isBuiltIn ? Database : User;
  const sourceColor = isBuiltIn ? "text-purple-400" : "text-orange-400";

  return (
    <div 
      className={`relative p-6 rounded-xl border-2 transition-all shadow-sm hover:shadow-md flex flex-col h-full 
        ${getCardStyle()} 
        ${isSelected ? 'ring-2 ring-purple-500 ring-offset-2 border-purple-500' : ''}
        ${isBatchMode ? 'cursor-pointer hover:bg-slate-50' : ''}
      `}
      onClick={isBatchMode ? onSelect : undefined}
    >
      <div className="flex justify-between items-center mb-4">
        {/* 左上角：標籤區 (含來源圖示) */}
        <div className="flex gap-2 items-center">
          <div className={`flex items-center justify-center p-1 rounded-full bg-slate-50 ${sourceColor}`} title={isBuiltIn ? "內建單字" : "自行新增"}>
            <SourceIcon size={14} strokeWidth={2.5}/>
          </div>
          <span className="h-6 flex items-center justify-center px-2 text-xs font-bold rounded bg-slate-800 text-white">{item.level}</span>
          <span className={`h-6 flex items-center justify-center px-2 text-xs font-bold rounded uppercase ${getTypeBadgeColor()}`}>{item.type}</span>
        </div>

        {/* 右上角：操作區 (或選取框) */}
        <div className="flex gap-1 items-center">
           {isBatchMode ? (
             <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-purple-600 border-purple-600' : 'border-slate-300'}`}>
                {isSelected && <Check size={16} className="text-white"/>}
             </div>
           ) : (
             <>
                <button onClick={(e) => {e.stopPropagation(); onToggleStatus(item.id, item.status, 'review')}} className={`p-1.5 rounded-full ${item.status==='review'?'bg-amber-500 text-white':'text-gray-300 hover:text-amber-500'}`} title="需加強"><AlertCircle size={18}/></button>
                <button onClick={(e) => {e.stopPropagation(); onToggleStatus(item.id, item.status, 'learned')}} className={`p-1.5 rounded-full ${item.status==='learned'?'bg-emerald-500 text-white':'text-gray-300 hover:text-emerald-500'}`} title="已學會"><CheckCircle size={18}/></button>
                <button onClick={(e) => {e.stopPropagation(); onEditCard(item)}} className="p-1.5 rounded-full text-gray-300 hover:text-blue-500 ml-1" title="編輯卡片"><Edit3 size={16}/></button>
                <button onClick={(e) => {e.stopPropagation(); onDelete(item.id)}} className="p-1.5 rounded-full text-gray-300 hover:text-red-500" title="刪除"><Trash2 size={16}/></button>
             </>
           )}
        </div>
      </div>
      <div className="mb-4">
        <div className="flex items-baseline gap-2 mb-1 flex-wrap">
          {item.type === 'noun' && <span className={`text-lg font-bold ${item.article==='der'?'text-blue-600':item.article==='die'?'text-red-500':item.article==='das'?'text-green-600':'text-gray-500'}`}>{item.article}</span>}
          <h2 className="text-3xl font-bold text-slate-800">{item.word}</h2>
          <button onClick={(e) => handleSpeak(item.type==='noun'?`${item.article} ${item.word}`:item.word, e)} className="text-slate-400 hover:text-slate-800 p-1"><Volume2 size={20}/></button>
        </div>
        <div className="text-sm text-slate-500 mb-2 font-mono">{item.type==='noun'&&item.plural?`Pl. ${item.word}${item.plural}`:''}</div>
        
        {/* 翻譯區域 */}
        <div className="border-l-4 border-slate-200 pl-3">
          <p className="text-lg text-slate-700 font-medium">{item.meaning}</p>
          <p className="text-sm text-slate-400 mt-0.5">
            {item.englishMeaning ? `(${item.englishMeaning})` : <span className="opacity-50 italic">(點擊上方編輯按鈕新增英文)</span>}
          </p>
        </div>

        {item.type==='verb'&&item.conjugation&&<div className="mt-3 bg-slate-100 p-2 rounded text-sm text-slate-600 flex gap-2 border border-slate-200"><Clock size={16} className="mt-0.5 text-purple-500 shrink-0"/><div className="font-mono">{item.conjugation}</div></div>}
      </div>
      <div className="mt-auto pt-4 border-t border-black/5">
        <div className="flex gap-2 mb-1"><p className="text-sm text-slate-600 italic flex-1">"{item.example}"</p><button onClick={(e)=>handleSpeak(item.example,e)} className="text-slate-400 hover:text-slate-600"><Volume2 size={16}/></button></div>
        <p className="text-xs text-slate-400 pl-1">{item.exampleMeaning}</p>
      </div>

      <div className="mt-3 pt-2 border-t border-dashed border-gray-200 flex flex-col gap-2">
        <div className="flex justify-between items-center">
          {item.note ? (
            <button 
              onClick={(e) => {e.stopPropagation(); setIsNoteExpanded(!isNoteExpanded)}}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
            >
              {isNoteExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
              {isNoteExpanded ? '收起筆記' : '查看筆記'}
            </button>
          ) : <span className="text-xs text-transparent">.</span>}
          
          {/* 筆記按鈕 (筆記本圖示 NotebookPen) */}
          <button 
            onClick={(e) => {e.stopPropagation(); onEditNote(item)}}
            className="text-slate-400 hover:text-purple-600 transition-colors p-1 rounded-full hover:bg-purple-50"
            title="編輯筆記"
          >
            <NotebookPen size={16} />
          </button>
        </div>
        
        {item.note && isNoteExpanded && (
          <div className="bg-yellow-50 p-3 rounded-lg text-sm text-slate-700 border border-yellow-100 relative">
            <StickyNote size={14} className="text-yellow-400 absolute top-2 right-2 opacity-50"/>
            <p className="whitespace-pre-wrap">{item.note}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- AI 批量匯入 Modal ---
const BatchImportModal = ({ isOpen, onClose, onBatchAdd }) => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState('');
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => { setHasKey(!!getEffectiveApiKey()); }, [isOpen]);

  if (!isOpen) return null;

  const processBatch = async () => {
    if (!inputText.trim()) { alert("請輸入單字"); return; }
    try {
        const json = JSON.parse(inputText);
        if (Array.isArray(json)) {
            setIsProcessing(true); setStatusMsg('還原備份...');
            await onBatchAdd(json);
            setStatusMsg('成功！'); setTimeout(() => { onClose(); setInputText(''); setStatusMsg(''); setIsProcessing(false); }, 1000);
            return;
        }
    } catch (e) {}

    if (!getEffectiveApiKey()) { alert("請先點擊右上角設定 API Key"); return; }

    const words = inputText.split(/[\n,;]+/).map(w => w.trim()).filter(w => w.length > 0);
    if (!words.length) return;

    setIsProcessing(true); setProgress(0);
    const BATCH = 5; 
    const total = Math.ceil(words.length / BATCH);
    let successCount = 0; 
    let skippedCount = 0;

    for (let i = 0; i < total; i++) {
      setStatusMsg(`AI 分析中... (${i+1}/${total})`);
      try {
        const chunk = words.slice(i * BATCH, (i + 1) * BATCH);
        // Prompt 更新：要求英文翻譯，並明確例句翻譯為繁體中文
        const prompt = `Translate German words: ${JSON.stringify(chunk)} to Traditional Chinese and English. 
        Return a valid JSON ARRAY. Each object: 
        - word
        - meaning (Chinese)
        - englishMeaning (English)
        - type (noun/verb/adj/adv)
        - level (A1/A2/B1)
        - article (der/die/das)
        - plural
        - conjugation (string, if verb: 3rd Pers. Sg. Indikativ for Präsens, Präteritum, Perfekt. e.g., "er geht, ging, ist gegangen")
        - example (German)
        - exampleMeaning (Traditional Chinese translation ONLY).`;
        
        const data = await callGeminiAI(prompt);
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const res = JSON.parse(text.replace(/```json|```/g, '').trim());
          if (Array.isArray(res)) { 
            const result = await onBatchAdd(res, 'custom'); // 自訂來源
            if (result) {
              successCount += result.added;
              skippedCount += result.skipped;
            }
          }
        }
      } catch (e) { 
        console.error("Batch Error:", e);
        setStatusMsg(`錯誤: ${e.message}`);
        await new Promise(r => setTimeout(r, 2000));
      }
      setProgress(Math.round(((i+1)/total)*100));
    }
    setIsProcessing(false);
    
    if (successCount > 0 || skippedCount > 0) {
      alert(`批量新增完成！\n\n✅ 成功新增: ${successCount} 個\n⚠️ 略過重複: ${skippedCount} 個`);
      setStatusMsg(`完成！新增 ${successCount} 個`);
      setTimeout(() => { onClose(); setInputText(''); setStatusMsg(''); setProgress(0); }, 2000);
    } else {
       setStatusMsg('未新增任何單字');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-purple-900 px-6 py-4 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center gap-3"><Sparkles size={20} className="text-yellow-400"/><h3 className="font-bold">AI 批量匯入</h3>
          {!hasKey && <span className="bg-red-500/20 text-red-200 text-xs px-2 py-1 rounded border border-red-500/50">未設定 API Key</span>}</div>
          {!isProcessing && <button onClick={onClose}><X size={20}/></button>}
        </div>
        <div className="p-6 space-y-4 overflow-y-auto text-slate-800">
          <textarea value={inputText} onChange={(e)=>setInputText(e.target.value)} disabled={isProcessing} placeholder="貼上單字列表 (一行一個)..." className="w-full h-48 p-4 border rounded font-mono text-sm"/>
          {isProcessing && <div className="w-full bg-slate-100 h-2 rounded overflow-hidden"><div className="bg-purple-600 h-2 transition-all" style={{width: `${progress}%`}}></div></div>}
          <div className="flex justify-between items-center">
             <span className="text-sm text-slate-500">{statusMsg}</span>
             {!isProcessing && <button onClick={processBatch} className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">開始分析</button>}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 單字編輯 Modal (通用：新增/編輯) ---
const WordFormModal = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState({ 
    word: '', article: '', plural: '', meaning: '', englishMeaning: '', 
    level: 'A2', type: 'noun', example: '', exampleMeaning: '', conjugation: '' 
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => { 
    setHasKey(!!getEffectiveApiKey()); 
    if (initialData) {
      setFormData(initialData); 
    } else {
      setFormData({ word: '', article: '', plural: '', meaning: '', englishMeaning: '', level: 'A2', type: 'noun', example: '', exampleMeaning: '', conjugation: '' });
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleAutoFill = async () => {
    if (!formData.word) { alert("請輸入單字"); return; }
    if (!getEffectiveApiKey()) { alert("請先點擊右上角設定 API Key"); return; }

    setIsGenerating(true);
    try {
      // Prompt 更新：針對動詞變化要求精確的 3 態
      const prompt = `Analyze German word "${formData.word}". Return valid JSON object: meaning (Chinese), englishMeaning (English), article, plural, type (noun/verb/adj/adv), level, example, exampleMeaning (Traditional Chinese translation ONLY), conjugation (string, if verb: 3rd Pers. Sg. Indikativ for Präsens, Präteritum, Perfekt. e.g., "er geht, ging, ist gegangen").`;
      const data = await callGeminiAI(prompt);
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        setFormData(prev => ({ ...prev, ...JSON.parse(text.replace(/```json|```/g, '').trim()) }));
      }
    } catch (e) { alert(`AI 錯誤: ${e.message}`); }
    setIsGenerating(false);
  };

  const handleSubmit = (e) => { 
    e.preventDefault(); 
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white shrink-0">
          <h3 className="font-bold text-lg">{initialData ? '編輯單字' : '新增單字'}</h3>
          <button onClick={onClose}><X size={20}/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto text-slate-800">
          <div className="flex gap-2">
            <input required value={formData.word} onChange={e=>setFormData({...formData, word: e.target.value})} className="flex-1 p-2 border rounded" placeholder="單字"/>
            <button type="button" onClick={handleAutoFill} disabled={isGenerating || !hasKey} className={`px-3 py-2 rounded text-white flex gap-2 items-center ${hasKey?'bg-purple-600':'bg-slate-400'}`}>{isGenerating?<Loader2 className="animate-spin" size={18}/>:<Sparkles size={18}/>} AI 填寫</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input required value={formData.meaning} onChange={e=>setFormData({...formData, meaning: e.target.value})} className="p-2 border rounded" placeholder="中文意思"/>
            <input value={formData.englishMeaning} onChange={e=>setFormData({...formData, englishMeaning: e.target.value})} className="p-2 border rounded" placeholder="英文意思"/>
          </div>
          <div className="grid grid-cols-2 gap-4"><select value={formData.type} onChange={e=>setFormData({...formData, type: e.target.value})} className="p-2 border rounded"><option value="noun">名詞</option><option value="verb">動詞</option><option value="adj">形容詞</option><option value="adv">副詞</option></select><select value={formData.level} onChange={e=>setFormData({...formData, level: e.target.value})} className="p-2 border rounded"><option value="A1">A1</option><option value="A2">A2</option><option value="B1">B1</option></select></div>
          <div className="grid grid-cols-2 gap-4"><select value={formData.article} onChange={e=>setFormData({...formData, article: e.target.value})} className="p-2 border rounded" disabled={formData.type!=='noun'}><option value="">-</option><option value="der">der</option><option value="die">die</option><option value="das">das</option></select><input value={formData.plural} onChange={e=>setFormData({...formData, plural: e.target.value})} className="p-2 border rounded" placeholder="複數" disabled={formData.type!=='noun'}/></div>
          {formData.type==='verb'&&<input value={formData.conjugation} onChange={e=>setFormData({...formData, conjugation: e.target.value})} className="w-full p-2 border border-purple-200 bg-purple-50 rounded" placeholder="動詞變化"/>}
          <input value={formData.example} onChange={e=>setFormData({...formData, example: e.target.value})} className="w-full p-2 border rounded" placeholder="例句"/>
          <input value={formData.exampleMeaning} onChange={e=>setFormData({...formData, exampleMeaning: e.target.value})} className="w-full p-2 border rounded" placeholder="例句翻譯"/>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">取消</button>
            <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded hover:bg-slate-800 flex items-center gap-2"><Save size={18}/> 儲存</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- 主程式 App ---
export default function App() {
  const [user, setUser] = useState(null);
  const [vocabList, setVocabList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showWordModal, setShowWordModal] = useState(false); 
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  // 新增：題庫 Modal 狀態
  const [showLibraryModal, setShowLibraryModal] = useState(false); 
  
  const [currentEditNoteItem, setCurrentEditNoteItem] = useState(null);
  const [currentEditItem, setCurrentEditItem] = useState(null); 
  const [authError, setAuthError] = useState(null);
  const [authErrorCode, setAuthErrorCode] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  const [selectedLevels, setSelectedLevels] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [selectedSources, setSelectedSources] = useState([]); 
  const [searchTerm, setSearchTerm] = useState(''); 

  // 1. 滾動偵測與篩選器收合 (預設收起)
  const [isScrolled, setIsScrolled] = useState(false);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  // 新增：批次管理模式
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());

  // 3. 處理滾動邏輯 (修復版：加入 Hysteresis 緩衝區)
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      // 往下捲動超過 100px 才判定為捲動
      if (currentY > 100 && !isScrolled) {
        setIsScrolled(true);
        setIsFilterExpanded(false); // 觸發收起
      } 
      // 往回捲到小於 20px 才判定為回到頂部
      else if (currentY < 20 && isScrolled) {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isScrolled]);

  // 4. 監聽 isScrolled 變化來自動收合 (只執行一次)
  useEffect(() => {
    if (isScrolled && isFilterExpanded) {
      setIsFilterExpanded(false); // 往下捲 -> 自動收起
    }
  }, [isScrolled]);

  // 5. 注入 Tailwind Config (強制 class 模式 - 雖然不切換但保留架構)
  useEffect(() => {
    if (!document.getElementById('tailwind-cdn')) {
      const script = document.createElement('script');
      script.id = 'tailwind-cdn';
      script.src = 'https://cdn.tailwindcss.com';
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (!auth) { setIsLoading(false); return; }
    getRedirectResult(auth).then((result) => { if (result) setUser(result.user); }).catch((error) => { console.error("Redirect Login Error:", error); setAuthErrorCode(error.code); setAuthError(`重新導向登入失敗: ${error.message}`); });
    const unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); setIsLoading(false); });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => { setAuthError(null); setAuthErrorCode(null); try { await signInWithPopup(auth, new GoogleAuthProvider()); } catch (error) { setAuthErrorCode(error.code); setAuthError(error.code === 'auth/popup-blocked' ? "彈出視窗被阻擋" : "登入失敗"); } };
  const handleRedirectLogin = async () => { setAuthError(null); try { await signInWithRedirect(auth, new GoogleAuthProvider()); } catch (error) { setAuthError(error.message); } };
  const handleLogout = async () => { try { await signOut(auth); setVocabList([]); } catch (error) { console.error("Logout Failed", error); } };

  // Data Fetching
  useEffect(() => {
    if (!user || !db) return;
    const q = collection(db, 'vocab_users', user.uid, 'items');
    const unsubscribe = onSnapshot(q, (snapshot) => { 
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        data.sort((a, b) => {
            const timeA = a.createdAt ? a.createdAt.seconds : 0;
            const timeB = b.createdAt ? b.createdAt.seconds : 0;
            return timeB - timeA;
        });
        setVocabList(data);
    }, (err) => { if (err.code === 'permission-denied') setAuthError("資料庫權限不足"); });
    return () => unsubscribe();
  }, [user]);

  // 修改：分級匯入處理函式
  const handleImportLevel = async (wordList) => {
    if (!user) return;
    setIsImporting(true);
    try {
        const result = await handleBatchAdd(wordList, 'builtin');
        alert(`匯入完成！\n\n✅ 成功新增: ${result.added} 個\n⚠️ 略過重複: ${result.skipped} 個`);
    } catch (e) {
        console.error("Import Error", e);
        alert("匯入發生錯誤，請稍後再試。");
    } finally {
        setIsImporting(false);
    }
  };
  
  // 處理新增或更新
  const handleSaveWord = async (wordData) => {
    if (!user) return;
    if (!currentEditItem) {
        const isDuplicate = vocabList.some(item => item.word.toLowerCase() === wordData.word.trim().toLowerCase());
        if (isDuplicate) {
            alert(`單字 "${wordData.word}" 已經存在了！無法重複新增。`);
            return; 
        }
    }
    if (currentEditItem) {
      await updateDoc(doc(db, 'vocab_users', user.uid, 'items', currentEditItem.id), wordData);
    } else {
      await addDoc(collection(db, 'vocab_users', user.uid, 'items'), { ...wordData, status: 'new', source: 'custom', createdAt: serverTimestamp() });
    }
    setShowWordModal(false);
  };

  const handleToggleStatus = async (id, currentStatus, targetStatus) => { const newStatus = currentStatus === targetStatus ? 'new' : targetStatus; await updateDoc(doc(db, 'vocab_users', user.uid, 'items', id), { status: newStatus }); };
  const handleDeleteWord = async (id) => { if (window.confirm('確定刪除？')) await deleteDoc(doc(db, 'vocab_users', user.uid, 'items', id)); };
  
  // 批量新增 (含防呆檢查)
  const handleBatchAdd = async (words, source = 'custom') => { 
    const CHUNK_SIZE = 400;
    const chunks = [];
    for (let i = 0; i < words.length; i += CHUNK_SIZE) {
        chunks.push(words.slice(i, i + CHUNK_SIZE));
    }

    let totalAdded = 0;
    let totalSkipped = 0;

    for (const chunk of chunks) {
        const batch = writeBatch(db);
        let batchCount = 0;

        chunk.forEach(w => {
            const isDuplicate = vocabList.some(item => item.word.toLowerCase() === w.word.trim().toLowerCase());
            if (isDuplicate) {
                totalSkipped++;
            } else {
                const docRef = doc(collection(db, 'vocab_users', user.uid, 'items')); 
                const newWord = {
                    word: w.word || '',
                    meaning: w.meaning || '',
                    englishMeaning: w.englishMeaning || '',
                    article: w.article || '',
                    plural: w.plural || '',
                    type: w.type || 'noun',
                    level: w.level || 'A1',
                    example: w.example || '',
                    exampleMeaning: w.exampleMeaning || '',
                    conjugation: w.conjugation || '',
                    status: 'new',
                    source: source, 
                    createdAt: serverTimestamp(),
                    // 確保所有欄位都有值
                    ...w 
                };
                batch.set(docRef, newWord); 
                batchCount++;
                totalAdded++;
            }
        });

        if (batchCount > 0) {
            await batch.commit();
        }
    }
    return { added: totalAdded, skipped: totalSkipped };
  };
  
  const downloadData = () => { const blob = new Blob([JSON.stringify(vocabList, null, 2)], { type: "application/json" }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "german_backup.json"; link.click(); };

  const openEditNote = (item) => {
    setCurrentEditNoteItem(item);
    setShowNoteModal(true);
  };

  const handleSaveNote = async (newContent) => {
    if (currentEditNoteItem) {
      await updateDoc(doc(db, 'vocab_users', user.uid, 'items', currentEditNoteItem.id), { note: newContent });
    }
  };

  const openAddModal = () => {
    setCurrentEditItem(null); 
    setShowWordModal(true);
  };

  const openEditCardModal = (item) => {
    setCurrentEditItem(item); 
    setShowWordModal(true);
  };

  const toggleFilter = (setter, value) => { setter(prev => prev.includes(value) ? prev.filter(p => p !== value) : [...prev, value]); };
  
  const filtered = vocabList.filter(item => {
    const levelMatch = selectedLevels.length === 0 || selectedLevels.includes(item.level);
    const typeMatch = selectedTypes.length === 0 || selectedTypes.includes(item.type);
    const statusMatch = selectedStatuses.length === 0 || selectedStatuses.some(s => s === 'new' ? (item.status === 'new' || !item.status) : item.status === s);
    const sourceMatch = selectedSources.length === 0 || selectedSources.includes(item.source || 'custom');
    const searchMatch = searchTerm === '' || item.word.toLowerCase().includes(searchTerm.toLowerCase());
    return levelMatch && typeMatch && statusMatch && sourceMatch && searchMatch;
  });

  const activeFiltersCount = selectedLevels.length + selectedTypes.length + selectedStatuses.length + selectedSources.length;

  if (isLoading) return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500"><Loader2 className="animate-spin mb-4" size={32} /><p>載入中...</p></div>;
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes("apiKey")) return <div className="min-h-screen flex items-center justify-center bg-slate-100 p-8 font-sans"><div className="bg-white p-8 rounded-xl shadow-lg max-w-lg w-full text-center"><AlertCircle size={32} className="mx-auto text-red-500 mb-4"/><h2 className="text-2xl font-bold text-slate-800 mb-2">尚未設定資料庫</h2><p className="text-slate-500">請打開 <code>App.jsx</code> 填入您的 Firebase Keys。</p></div></div>;
  if (!user) return <LoginScreen onLogin={handleLogin} onRedirectLogin={handleRedirectLogin} error={authError} errorCode={authErrorCode} />;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2"><div className="bg-yellow-400 p-1.5 rounded text-slate-900"><BookOpen size={20} /></div><span className="font-bold text-lg hidden sm:inline">Deutsch App</span></div>
        <div className="flex gap-2 items-center">
            {/* 批次選取開關 */}
            <button 
              onClick={() => { setIsBatchMode(!isBatchMode); setSelectedItems(new Set()); }}
              className={`p-2 border rounded-lg transition-colors ${isBatchMode ? 'bg-purple-100 border-purple-400 text-purple-700' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'}`}
              title="批次管理"
            >
              <ListChecks size={18} />
            </button>

            <div className="flex items-center gap-2 mr-2 border-r pr-4 border-slate-200">
               {/* 這裡改成下拉選單 UserMenu */}
               <UserMenu 
                 user={user} 
                 onLogout={handleLogout} 
                 onImportLibrary={() => setShowLibraryModal(true)}
                 onDownload={downloadData}
                 onSettings={() => setShowSettingsModal(true)}
               />
            </div>
            
            <button onClick={() => setShowBatchModal(true)} className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-1 shadow-sm"><FileText size={18} /> <span className="hidden sm:inline">批量</span></button>
            <button onClick={openAddModal} className="px-3 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 flex items-center gap-1 shadow-sm"><Plus size={18} /> <span className="hidden sm:inline">新增</span></button>
        </div>
      </header>

      {/* 2. 主畫面使用全寬版面 (max-w-full + 適當 padding) */}
      <main className="w-full max-w-[1920px] mx-auto px-4 md:px-6 lg:px-8 py-4 flex-grow">
        {vocabList.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-xl mt-8 mx-auto max-w-4xl">
             <GraduationCap size={48} className="mx-auto text-slate-300 mb-4"/>
             <h3 className="text-xl font-bold text-slate-700 mb-2">單字本是空的</h3>
             <p className="text-slate-500 mb-6">點擊右上角的「新增」按鈕開始建立單字庫，或匯入內建題庫。</p>
             <div className="flex justify-center gap-4">
                <button onClick={() => setShowLibraryModal(true)} className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"><Library size={18}/> 匯入內建題庫</button>
             </div>
          </div>
         ) : (
          <>
             {/* 1. 智慧收折篩選器 */}
             <div className={`mb-6 bg-white rounded-2xl border border-slate-200 shadow-sm sticky top-20 z-10 transition-all duration-300 ease-in-out ${isScrolled && !isFilterExpanded ? 'p-2' : 'p-5'}`}>
                {/* 篩選器 Header (點擊可展開/收起) */}
                <div 
                  className="flex items-center justify-between"
                >
                  {/* 搜尋框區塊 */}
                  <div className="flex-1 max-w-md mr-4">
                    <div className="relative group">
                       <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500" size={16} />
                       <input 
                         type="text" 
                         placeholder="搜尋德文單字..." 
                         value={searchTerm}
                         onChange={(e) => setSearchTerm(e.target.value)}
                         className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm transition-all"
                       />
                    </div>
                  </div>

                  <div 
                    className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider cursor-pointer select-none"
                    onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                  >
                    <Filter size={14} />
                    <span>篩選 ({filtered.length}/{vocabList.length})</span>
                    {isScrolled && !isFilterExpanded && activeFiltersCount > 0 && (
                      <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full normal-case">
                        {activeFiltersCount} 個條件
                      </span>
                    )}
                    {isScrolled && (
                      <div className="text-slate-400 hover:text-slate-600">
                        {isFilterExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* 篩選內容區 (根據狀態顯示/隱藏) */}
                {isFilterExpanded && (
                  <div className={`space-y-3 ${isScrolled ? 'mt-4 animate-in fade-in slide-in-from-top-2 duration-200' : 'mt-4'}`}>
                    <div className="flex flex-wrap gap-2 items-center"><span className="text-xs text-slate-400 mr-1">等級:</span>{['A1', 'A2', 'B1'].map(l => (<FilterChip key={l} label={l} isSelected={selectedLevels.includes(l)} onClick={() => toggleFilter(setSelectedLevels, l)} colorClass="bg-slate-700 text-white" />))}</div>
                    <div className="flex flex-wrap gap-2 items-center"><span className="text-xs text-slate-400 mr-1">詞性:</span><FilterChip label="名詞" isSelected={selectedTypes.includes('noun')} onClick={() => toggleFilter(setSelectedTypes, 'noun')} colorClass="bg-blue-600 text-white" /><FilterChip label="動詞" isSelected={selectedTypes.includes('verb')} onClick={() => toggleFilter(setSelectedTypes, 'verb')} colorClass="bg-purple-600 text-white" /><FilterChip label="形容詞" isSelected={selectedTypes.includes('adj')} onClick={() => toggleFilter(setSelectedTypes, 'adj')} colorClass="bg-yellow-500 text-white" /><FilterChip label="副詞" isSelected={selectedTypes.includes('adv')} onClick={() => toggleFilter(setSelectedTypes, 'adv')} colorClass="bg-orange-500 text-white" /></div>
                    <div className="flex flex-wrap gap-2 items-center"><span className="text-xs text-slate-400 mr-1">狀態:</span><FilterChip label="未標記" isSelected={selectedStatuses.includes('new')} onClick={() => toggleFilter(setSelectedStatuses, 'new')} colorClass="bg-slate-400 text-white" /><FilterChip label="需加強" isSelected={selectedStatuses.includes('review')} onClick={() => toggleFilter(setSelectedStatuses, 'review')} colorClass="bg-amber-500 text-white" /><FilterChip label="已學會" isSelected={selectedStatuses.includes('learned')} onClick={() => toggleFilter(setSelectedStatuses, 'learned')} colorClass="bg-emerald-600 text-white" /></div>
                    {/* 新增：來源篩選 */}
                    <div className="flex flex-wrap gap-2 items-center"><span className="text-xs text-slate-400 mr-1">來源:</span><FilterChip label="自訂" isSelected={selectedSources.includes('custom')} onClick={() => toggleFilter(setSelectedSources, 'custom')} colorClass="bg-orange-500 text-white" /><FilterChip label="內建" isSelected={selectedSources.includes('builtin')} onClick={() => toggleFilter(setSelectedSources, 'builtin')} colorClass="bg-purple-500 text-white" /></div>
                  </div>
                )}
             </div>
             
             {/* 3. 四欄式排版 (lg:grid-cols-4) */}
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
               {filtered.map(item => <VocabularyCard key={item.id} item={item} onToggleStatus={handleToggleStatus} onDelete={handleDeleteWord} onEditNote={openEditNote} onEditCard={openEditCardModal} isBatchMode={isBatchMode} isSelected={selectedItems.has(item.id)} onSelect={() => toggleSelect(item.id)} />)}
             </div>

             {/* 批次操作浮動選單 (手機版樣式優化：w-[92%] + justify-between + whitespace-nowrap) */}
             {isBatchMode && selectedItems.size > 0 && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-[92%] max-w-md bg-white px-4 py-3 rounded-full shadow-xl border border-slate-200 flex justify-between items-center gap-3 animate-in slide-in-from-bottom-4 z-50">
                  <span className="text-slate-700 font-bold whitespace-nowrap ml-2">{selectedItems.size} 張已選取</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setSelectedItems(new Set())} className="text-slate-500 hover:text-slate-700 text-sm px-3 py-2 whitespace-nowrap">取消</button>
                    <button onClick={handleBatchDelete} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 whitespace-nowrap shadow-sm">
                      <Trash2 size={16}/> 刪除
                    </button>
                  </div>
                </div>
             )}
          </>
         )}
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm text-slate-500">
            © 2025 German Vocabulary Tool. 
          </p>
          <div className="mt-2 flex items-center justify-center gap-2 text-xs text-slate-400">
            <span>Developed by</span>
            <a 
              href="https://nikkistudiotw.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-800 font-semibold flex items-center gap-1 transition-colors"
            >
              Nikki Yu <Globe size={12} />
            </a>
          </div>
        </div>
      </footer>

      <BatchImportModal isOpen={showBatchModal} onClose={() => setShowBatchModal(false)} onBatchAdd={handleBatchAdd} />
      <WordFormModal isOpen={showWordModal} onClose={() => setShowWordModal(false)} onSave={handleSaveWord} initialData={currentEditItem} />
      <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />
      <NoteModal isOpen={showNoteModal} onClose={() => setShowNoteModal(false)} note={currentEditNoteItem?.note} onSave={handleSaveNote} />
      <LibraryModal isOpen={showLibraryModal} onClose={() => setShowLibraryModal(false)} onImport={handleImportLevel} />
    </div>
  );
}