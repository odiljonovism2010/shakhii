import React, { useState, useEffect, useMemo, useContext, createContext } from "react";
import { createRoot } from "react-dom/client";
import "./App.css";

/* ---------- storage ---------- */
function load(k, d) {
  try {
    const v = localStorage.getItem("fy:" + k);
    return v ? JSON.parse(v) : d;
  } catch (e) {
    return d;
  }
}
function save(k, v) {
  try {
    localStorage.setItem("fy:" + k, JSON.stringify(v));
  } catch (e) {}
}
function useStore(k, d) {
  const [v, setV] = useState(() => load(k, d));
  useEffect(() => {
    save(k, v);
  }, [k, v]);
  return [v, setV];
}

/* ---------- helpers ---------- */
const fmt = (n) => Math.round(n).toLocaleString("ru-RU").replace(/ | /g, " ");
const MONTHS = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avgust",
  "sentabr",
  "oktabr",
  "noyabr",
  "dekabr",
];
const DAYS = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
const iso = (d) =>
  d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const dtxt = (d) => DAYS[d.getDay()] + ", " + d.getDate() + "-" + MONTHS[d.getMonth()];
const parseIso = (s) => {
  const p = s.split("-").map(Number);
  return new Date(p[0], p[1] - 1, p[2]);
};
const hash = (s) => {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
};
const normPhone = (s) => {
  const d = (s || "").replace(/\D/g, "");
  if (d.length === 9) return "+998" + d;
  if (d.length === 12 && d.startsWith("998")) return "+" + d;
  return null;
};
const REGIONS = [
  "Toshkent shahri",
  "Toshkent viloyati",
  "Qoraqalpogʻiston Respublikasi",
  "Andijon viloyati",
  "Buxoro viloyati",
  "Fargʻona viloyati",
  "Jizzax viloyati",
  "Xorazm viloyati",
  "Namangan viloyati",
  "Navoiy viloyati",
  "Qashqadaryo viloyati",
  "Samarqand viloyati",
  "Sirdaryo viloyati",
  "Surxondaryo viloyati",
];

/* ---------- data ---------- */
const CATS = [
  ["hujjat", "Shaxsiy hujjatlar"],
  ["oila", "Oila va ijtimoiy yordam"],
  ["biznes", "Tadbirkorlik"],
  ["soliq", "Soliq"],
  ["talim", "Taʼlim"],
  ["soglik", "Sogʻliqni saqlash"],
  ["uy", "Uy-joy va yer"],
  ["transport", "Transport"],
];
const catName = (id) => (CATS.find((c) => c[0] === id) || [0, ""])[1];

const SERVICES = [
  {
    id: "id-karta",
    cat: "hujjat",
    title: "ID-karta yoki biometrik pasport olish",
    agency: "Davlat xizmatlari markazi",
    online: true,
    time: "Bir necha ish kuni",
    fee: "Davlat boji (bazaviy hisoblash miqdoridan hisoblanadi)",
    docs: [
      "Amaldagi pasport yoki ID-karta (almashtirishda)",
      "Tugʻilganlik haqida guvohnoma (birinchi marta olishda)",
      "Davlat boji toʻlovi kvitansiyasi",
      "Doimiy roʻyxatga olinganlik haqida maʼlumot",
    ],
    steps: [
      "Hujjatlar roʻyxatini tayyorlang",
      "Navbatga yoziling yoki my.gov.uz orqali ariza yuboring",
      "Markazga borib biometrik maʼlumotlarni topshiring",
      "Tayyor hujjatni oling",
    ],
  },
  {
    id: "propiska",
    cat: "hujjat",
    title: "Doimiy yashash joyiga roʻyxatga olish",
    agency: "Davlat xizmatlari markazi",
    online: true,
    time: "Bir necha ish kuni",
    fee: "Boj miqdori xizmat turiga qarab belgilanadi",
    docs: [
      "Shaxsni tasdiqlovchi hujjat",
      "Uy-joyga egalik yoki foydalanish huquqini tasdiqlovchi hujjat",
      "Uy egasining roziligi (kerak boʻlsa)",
    ],
    steps: [
      "Uy egasi bilan kelishing",
      "Hujjatlarni tayyorlang",
      "Onlayn ariza bering yoki markazga boring",
      "Roʻyxatga olinganlik haqida maʼlumotni oling",
    ],
  },
  {
    id: "haydovchi",
    cat: "transport",
    title: "Haydovchilik guvohnomasini olish yoki almashtirish",
    agency: "Yoʻl harakati xavfsizligi xizmati",
    online: true,
    time: "Imtihon va hujjat topshirish kunlariga bogʻliq",
    fee: "Imtihon va guvohnoma uchun toʻlovlar",
    docs: [
      "Shaxsni tasdiqlovchi hujjat",
      "Tibbiy maʼlumotnoma",
      "Haydovchilar tayyorlash kursini tamomlaganlik haqida hujjat",
      "Toʻlov kvitansiyasi",
    ],
    steps: [
      "Tibbiy koʻrikdan oʻting",
      "Kursni tamomlang",
      "Imtihonga yoziling",
      "Muvaffaqiyatli topshirgach guvohnomani oling",
    ],
  },
  {
    id: "avto-royxat",
    cat: "transport",
    title: "Avtomobilni roʻyxatdan oʻtkazish",
    agency: "Yoʻl harakati xavfsizligi xizmati",
    online: false,
    time: "Bir ish kuni ichida boʻlishi mumkin",
    fee: "Roʻyxatdan oʻtkazish va davlat raqami uchun toʻlovlar",
    docs: [
      "Shaxsni tasdiqlovchi hujjat",
      "Oldi-sotdi yoki egalik huquqini tasdiqlovchi hujjat",
      "Sugʻurta polisi",
      "Toʻlov kvitansiyalari",
    ],
    steps: [
      "Hujjatlarni tayyorlang",
      "Navbatga yoziling",
      "Avtomobilni koʻrikka olib keling",
      "Texnik pasport va raqamni oling",
    ],
  },
  {
    id: "tugilish",
    cat: "oila",
    title: "Tugʻilganlik haqida guvohnoma",
    agency: "FHDYo boʻlimi",
    online: true,
    time: "Murojaat kuni yoki bir necha kun",
    fee: "Odatda bepul yoki kam miqdorda",
    docs: ["Ota-onaning pasportlari", "Tugʻruqxonadan maʼlumotnoma", "Nikoh haqida guvohnoma (mavjud boʻlsa)"],
    steps: ["Tugʻruqxonadan maʼlumotnomani oling", "Ariza bering", "Guvohnomani oling"],
  },
  {
    id: "nikoh",
    cat: "oila",
    title: "Nikohdan oʻtishni qayd etish",
    agency: "FHDYo boʻlimi",
    online: true,
    time: "Ariza berilgandan keyin belgilangan kutish muddati bor",
    fee: "Davlat boji",
    docs: [
      "Har ikkala tomonning pasporti",
      "Davlat boji toʻlovi kvitansiyasi",
      "Oldingi nikohning bekor qilinganligi haqida hujjat (kerak boʻlsa)",
    ],
    steps: ["Ikkala tomon ariza beradi", "Qayd etish sanasi belgilanadi", "Marosim va guvohnomani olish"],
  },
  {
    id: "ijtimoiy",
    cat: "oila",
    title: "Ijtimoiy yordam uchun ariza",
    agency: "Mahalla va ijtimoiy himoya boʻlimi",
    online: true,
    time: "Ariza koʻrib chiqilishi bilan aniqlanadi",
    fee: "Bepul",
    docs: ["Oila aʼzolari pasportlari", "Oila tarkibi haqida maʼlumotnoma", "Daromad haqida maʼlumot"],
    steps: ["Mahalla yoki onlayn orqali ariza bering", "Oila daromadi tekshiriladi", "Qaror haqida xabar oling"],
  },
  {
    id: "yatt",
    cat: "biznes",
    title: "Yakka tartibdagi tadbirkorni roʻyxatdan oʻtkazish",
    agency: "Davlat xizmatlari markazi",
    online: true,
    time: "Odatda tez, bir necha soat yoki kun",
    fee: "Roʻyxatdan oʻtish toʻlovi",
    docs: ["Pasport yoki ID-karta", "Faoliyat turi haqida maʼlumot", "Manzil maʼlumoti"],
    steps: [
      "Faoliyat turini tanlang",
      "Onlayn ariza yuboring",
      "Guvohnomani elektron koʻrinishda oling",
      "Soliq rejimini tanlang",
    ],
  },
  {
    id: "mchj",
    cat: "biznes",
    title: "MChJ tashkil etish",
    agency: "Davlat xizmatlari markazi",
    online: true,
    time: "Bir necha ish kuni",
    fee: "Roʻyxatdan oʻtish toʻlovi",
    docs: ["Taʼsischilar pasportlari", "Ustav", "Yuridik manzil tasdigʻi", "Taʼsis shartnomasi yoki qarori"],
    steps: [
      "Nom va faoliyat turini tanlang",
      "Ustavni tayyorlang",
      "Hujjatlarni yuboring",
      "Guvohnoma va STIRni oling",
    ],
  },
  {
    id: "soliq-qarz",
    cat: "soliq",
    title: "Soliq qarzini tekshirish",
    agency: "Davlat soliq qoʻmitasi",
    online: true,
    time: "Darhol",
    fee: "Bepul",
    docs: ["Shaxsiy identifikatsiya maʼlumotlari (JShShIR yoki STIR)"],
    steps: ["Soliq kabinetiga kiring", "Qarzdorlik boʻlimini oching", "Kerak boʻlsa onlayn toʻlang"],
  },
  {
    id: "kadastr",
    cat: "uy",
    title: "Kadastr maʼlumotnomasini olish",
    agency: "Kadastr agentligi",
    online: true,
    time: "Bir necha ish kuni",
    fee: "Xizmat haqi",
    docs: ["Shaxsni tasdiqlovchi hujjat", "Mulkka egalik hujjati", "Kadastr raqami (mavjud boʻlsa)"],
    steps: ["Mulk maʼlumotlarini tayyorlang", "Ariza yuboring", "Maʼlumotnomani oling"],
  },
  {
    id: "mulk",
    cat: "uy",
    title: "Mulk huquqini davlat roʻyxatidan oʻtkazish",
    agency: "Kadastr agentligi",
    online: true,
    time: "Bir necha ish kuni",
    fee: "Davlat boji va xizmat haqi",
    docs: ["Pasport yoki ID-karta", "Oldi-sotdi, hadya yoki meros hujjati", "Toʻlov kvitansiyasi", "Kadastr hujjati"],
    steps: ["Bitimni rasmiylashtiring", "Hujjatlarni topshiring", "Roʻyxatdan oʻtganlik haqida maʼlumotni oling"],
  },
  {
    id: "maktab",
    cat: "talim",
    title: "Bolani maktabga qabul qilish",
    agency: "Xalq taʼlimi boʻlimi",
    online: true,
    time: "Qabul davrida",
    fee: "Bepul",
    docs: [
      "Bolaning tugʻilganlik haqida guvohnomasi",
      "Ota-onaning pasporti",
      "Tibbiy karta",
      "Yashash manzili haqida maʼlumot",
    ],
    steps: ["Hududga biriktirilgan maktabni aniqlang", "Onlayn ariza bering", "Hujjatlarni maktabga topshiring"],
  },
  {
    id: "bogcha",
    cat: "talim",
    title: "Bolani bogʻchaga navbatga qoʻyish",
    agency: "Maktabgacha taʼlim boʻlimi",
    online: true,
    time: "Navbat holatiga bogʻliq",
    fee: "Davlat bogʻchasida oylik toʻlov bor",
    docs: ["Bolaning tugʻilganlik haqida guvohnomasi", "Ota-onaning pasporti", "Yashash manzili haqida maʼlumot"],
    steps: ["Onlayn ariza bering", "Navbat raqamingizni saqlang", "Joy ajratilganda xabar oling"],
  },
  {
    id: "poliklinika",
    cat: "soglik",
    title: "Poliklinikaga biriktirilish",
    agency: "Oilaviy poliklinika",
    online: true,
    time: "Bir kun",
    fee: "Bepul",
    docs: ["Pasport yoki ID-karta", "Yashash manzili haqida maʼlumot"],
    steps: [
      "Yashash joyingizdagi poliklinikani aniqlang",
      "Ariza bering yoki registraturaga boring",
      "Shifokor qabuliga yoziling",
    ],
  },
  {
    id: "kommunal",
    cat: "uy",
    title: "Kommunal qarz va hisoblagichlarni tekshirish",
    agency: "Kommunal xizmat koʻrsatuvchilar",
    online: true,
    time: "Darhol",
    fee: "Bepul",
    docs: ["Shaxsiy hisob raqami", "Hisoblagich koʻrsatkichlari"],
    steps: ["Hisob raqamingizni toping", "Qarzdorlikni tekshiring", "Koʻrsatkichni yuboring va toʻlang"],
  },
];

const BRANCHES = ["Markaziy filial", "Shahar filiali", "Tuman filiali"];
const TOPICS = [
  "Yoʻl va koʻchalar",
  "Kommunal xizmatlar",
  "Sogʻliqni saqlash",
  "Taʼlim",
  "Ekologiya va obodonlashtirish",
  "Ijtimoiy yordam",
  "Davlat xizmatlari sifati",
  "Boshqa",
];
const STAGES = ["Qabul qilindi", "Tegishli organga yoʻnaltirildi", "Koʻrib chiqilmoqda", "Javob tayyor"];
const STAGE_AT = [0, 15, 45, 90];

const POLLS = [
  {
    id: "p1",
    q: "Mahallada eng avval nimani yaxshilash kerak?",
    opts: [
      ["Yoʻl va yoritish", 412],
      ["Bolalar maydonchalari", 298],
      ["Yashil hudud va daraxtlar", 251],
      ["Chiqindi yigʻish tizimi", 187],
    ],
  },
  {
    id: "p2",
    q: "Maktab atrofida qaysi xavfsizlik chorasi muhimroq?",
    opts: [
      ["Piyodalar oʻtish joyi va svetofor", 356],
      ["Tezlikni cheklovchi qurilmalar", 244],
      ["Kuzatuv kameralari", 173],
    ],
  },
  {
    id: "p3",
    q: "Qaysi xizmat birinchi navbatda onlayn soddalashtirilsin?",
    opts: [
      ["Hujjatlarni almashtirish", 301],
      ["Mulk va kadastr", 214],
      ["Tibbiy xizmatga yozilish", 338],
      ["Kommunal toʻlovlar", 162],
    ],
  },
];

const FAQ = [
  [
    "Xizmat uchun qaysi hujjatlar kerakligini qanday bilaman?",
    "Xizmatlar boʻlimidan kerakli xizmatni oching. Sahifada hujjatlar roʻyxati bor va uni belgilab borishingiz mumkin. Belgilar shu qurilmada saqlanadi.",
  ],
  [
    "Navbatga yozilgach nima qilaman?",
    "Navbat raqami va vaqtini saqlab qoʻying. Belgilangan vaqtdan oldinroq keling va asl hujjatlarni olib kelishni unutmang.",
  ],
  [
    "Murojaatim holatini qanday kuzataman?",
    "Murojaat yuborilgach sizga raqam beriladi. Uni Murojaat sahifasidagi kuzatish maydoniga kiriting.",
  ],
  [
    "Maʼlumotlarim qayerda saqlanadi?",
    "Bu sahifadagi murojaat, navbat va belgilar faqat sizning brauzeringizda saqlanadi. Hech qayerga yuborilmaydi.",
  ],
  [
    "Bu sayt rasmiy davlat portalimi?",
    "Yoʻq. Bu namunaviy loyiha. Rasmiy xizmatlar uchun my.gov.uz saytidan foydalaning.",
  ],
];

/* ---------- icons ---------- */
const ICONS = {
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm9 16-4-4",
  doc: "M7 3h7l4 4v14H7zM14 3v4h4M9 12h6M9 16h6",
  chat: "M4 5h16v11H9l-5 4z",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2",
  calc: "M6 3h12v18H6zM9 7h6M9 11h2M13 11h2M9 15h2M13 15h2",
  vote: "M5 13h14v7H5zM9 13l3-9 3 9M9 17h6",
  user: "M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 20c0-4 4-6 8-6s8 2 8 6",
  star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z",
  phone: "M6 3h4l2 5-2.5 1.5a11 11 0 0 0 5 5L16 12l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2z",
  check: "M5 12l5 5 9-10",
  moon: "M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10z",
  sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5",
  menu: "M4 7h16M4 12h16M4 17h16",
  x: "M6 6l12 12M18 6L6 18",
  arrow: "M5 12h14M13 6l6 6-6 6",
  ext: "M14 4h6v6M20 4l-9 9M18 14v6H4V6h6",
  trash: "M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13",
  pin: "M12 21s7-6 7-12a7 7 0 1 0-14 0c0 6 7 12 7 12zM12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
};
function Ic({ n, size = 20, fill }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ICONS[n]} />
    </svg>
  );
}

/* ---------- context ---------- */
const Ctx = createContext(null);
const useApp = () => useContext(Ctx);

/* ---------- routing ---------- */
const STACK = [];
let backing = false;
function goBack() {
  if (STACK.length > 1) {
    STACK.pop();
    const prev = STACK[STACK.length - 1];
    backing = true;
    location.hash = "#" + prev;
  } else {
    location.hash = "#bosh";
  }
}
function useRoute() {
  const get = () => (location.hash || "#bosh").slice(1) || "bosh";
  const [r, setR] = useState(() => {
    const x = get();
    STACK.push(x);
    return x;
  });
  useEffect(() => {
    const f = () => {
      const x = get();
      if (backing) backing = false;
      else if (STACK[STACK.length - 1] !== x) STACK.push(x);
      setR(x);
      window.scrollTo({ top: 0, behavior: "instant" });
    };
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);
  return r;
}
const ROUTE_NAMES = {
  xizmatlar: "Xizmatlar",
  murojaat: "Murojaat",
  navbat: "Navbat",
  hisoblash: "Hisoblagichlar",
  tashabbus: "Tashabbuslar",
  kabinet: "Kabinetim",
};
function BackBar({ route }) {
  const label = route.startsWith("xizmat-") ? "Xizmat tafsilotlari" : ROUTE_NAMES[route] || "";
  return (
    <div className="wrap backbar">
      <button className="backbtn" onClick={goBack} aria-label="Orqaga qaytish">
        <span className="flip">
          <Ic n="arrow" size={18} />
        </span>{" "}
        Orqaga
      </button>
      <nav className="crumbs" aria-label="Sahifa yoʻli">
        <a href="#bosh">Bosh sahifa</a>
        <span aria-hidden="true">/</span>
        <b>{label}</b>
      </nav>
    </div>
  );
}

/* ---------- small ui ---------- */
function PageHead({ kicker, title, lead }) {
  return (
    <header className="pagehead">
      <p className="kicker">{kicker}</p>
      <h1>{title}</h1>
      {lead && <p className="lead">{lead}</p>}
    </header>
  );
}
function Field({ id, label, hint, error, children }) {
  return (
    <div className={"field" + (error ? " has-err" : "")}>
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && !error && <p className="hint">{hint}</p>}
      {error && (
        <p className="err" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
function Empty({ title, text, href, cta }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      <p>{text}</p>
      {href && (
        <a className="btn" href={href}>
          {cta}
        </a>
      )}
    </div>
  );
}

/* ---------- Home ---------- */
function StarPattern() {
  return (
    <svg className="pattern" viewBox="0 0 240 240" aria-hidden="true">
      <defs>
        <pattern id="tile" width="60" height="60" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="currentColor" strokeWidth="1.2">
            <rect x="12" y="12" width="36" height="36" />
            <rect x="12" y="12" width="36" height="36" transform="rotate(45 30 30)" />
            <circle cx="30" cy="30" r="7" />
          </g>
        </pattern>
      </defs>
      <rect width="240" height="240" fill="url(#tile)" />
    </svg>
  );
}

function Home() {
  const { query, setQuery, saved, appeals, bookings } = useApp();
  const [q, setQ] = useState("");
  const popular = ["id-karta", "propiska", "yatt", "soliq-qarz", "maktab", "kommunal"].map((id) =>
    SERVICES.find((s) => s.id === id),
  );
  const go = (e) => {
    e.preventDefault();
    setQuery(q.trim());
    location.hash = "#xizmatlar";
  };
  const [open, setOpen] = useState(0);
  const quick = [
    ["#xizmatlar", "doc", "Xizmatlar", "Hujjatlar roʻyxati va qadamlar"],
    ["#murojaat", "chat", "Murojaat", "Yuboring va holatini kuzating"],
    ["#navbat", "clock", "Navbat", "Markazga qulay vaqtga yoziling"],
    ["#hisoblash", "calc", "Hisoblagichlar", "Maosh, kredit, boj, kommunal"],
  ];
  return (
    <div>
      <section className="hero">
        <StarPattern />
        <div className="wrap hero-in">
          <div className="hero-copy">
            <p className="kicker">Fuqarolar uchun yagona yoʻlboshchi</p>
            <h1>Qaysi xizmat sizga kerak?</h1>
            <p className="lead">
              Hujjatlar roʻyxatini bilib oling, navbatga yoziling, murojaat yuboring va oylik hisob-kitoblarni bir joyda
              bajaring.
            </p>
            <form className="searchbar" onSubmit={go} role="search">
              <label className="sr" htmlFor="hq">
                Xizmat qidirish
              </label>
              <Ic n="search" />
              <input
                id="hq"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Masalan: pasport, biznes, kadastr"
              />
              <button className="btn" type="submit">
                Qidirish
              </button>
            </form>
            <div className="chips">
              {["pasport", "propiska", "biznes", "kommunal", "maktab"].map((w) => (
                <button
                  key={w}
                  className="chip"
                  onClick={() => {
                    setQuery(w);
                    location.hash = "#xizmatlar";
                  }}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
          <div className="hero-card">
            <h2>Sizning faoliyatingiz</h2>
            <dl>
              <div>
                <dt>Yuborilgan murojaatlar</dt>
                <dd>{appeals.length}</dd>
              </div>
              <div>
                <dt>Faol navbatlar</dt>
                <dd>{bookings.length}</dd>
              </div>
              <div>
                <dt>Saqlangan xizmatlar</dt>
                <dd>{saved.length}</dd>
              </div>
            </dl>
            <a className="textlink" href="#kabinet">
              Kabinetni ochish <Ic n="arrow" size={16} />
            </a>
          </div>
        </div>
      </section>

      <section className="wrap block">
        <div className="grid g4">
          {quick.map((c) => (
            <a key={c[0]} className="qcard" href={c[0]}>
              <span className="qic">
                <Ic n={c[1]} />
              </span>
              <h3>{c[2]}</h3>
              <p>{c[3]}</p>
            </a>
          ))}
        </div>
      </section>

      <section className="wrap block">
        <div className="sechead">
          <h2>Koʻp soʻraladigan xizmatlar</h2>
          <a className="textlink" href="#xizmatlar">
            Hammasi <Ic n="arrow" size={16} />
          </a>
        </div>
        <div className="grid g3">
          {popular.map((s) => (
            <ServiceCard key={s.id} s={s} />
          ))}
        </div>
      </section>

      <section className="wrap block">
        <div className="steps3">
          <div>
            <span className="stepno">1</span>
            <h3>Xizmatni toping</h3>
            <p>Qidiruv yoki toifalar orqali kerakli xizmatni tanlang.</p>
          </div>
          <div>
            <span className="stepno">2</span>
            <h3>Hujjatlarni tayyorlang</h3>
            <p>Roʻyxatni belgilab boring, hech narsa esdan chiqmasin.</p>
          </div>
          <div>
            <span className="stepno">3</span>
            <h3>Navbat yoki ariza</h3>
            <p>Markazga vaqtni oldindan band qiling yoki murojaat yuboring.</p>
          </div>
        </div>
      </section>

      <section className="wrap block two">
        <div>
          <div className="sechead">
            <h2>Favqulodda raqamlar</h2>
          </div>
          <div className="sos">
            {[
              ["101", "Yongʻin xizmati"],
              ["102", "Ichki ishlar"],
              ["103", "Tez tibbiy yordam"],
              ["104", "Gaz xizmati"],
            ].map((x) => (
              <div key={x[0]} className="sosi">
                <b>{x[0]}</b>
                <span>{x[1]}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="sechead">
            <h2>Savollar va javoblar</h2>
          </div>
          <div className="faq">
            {FAQ.map((f, i) => (
              <div key={i} className={"faqi" + (open === i ? " on" : "")}>
                <button aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)}>
                  {f[0]}
                  <span className="pm">{open === i ? "−" : "+"}</span>
                </button>
                {open === i && <p>{f[1]}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function ServiceCard({ s }) {
  const { saved, toggleSaved } = useApp();
  const on = saved.includes(s.id);
  return (
    <article className="scard">
      <div className="scard-top">
        <span className="tag">{catName(s.cat)}</span>
        <button
          className={"star" + (on ? " on" : "")}
          aria-pressed={on}
          aria-label={on ? "Saqlanganlardan olib tashlash" : "Saqlash"}
          onClick={() => toggleSaved(s.id)}
        >
          <Ic n="star" size={18} fill={on} />
        </button>
      </div>
      <h3>
        <a href={"#xizmat-" + s.id}>{s.title}</a>
      </h3>
      <p className="muted">{s.agency}</p>
      <div className="scard-foot">
        {s.online ? <span className="badge ok">Onlayn ariza</span> : <span className="badge">Markazda</span>}
        <a className="textlink" href={"#xizmat-" + s.id}>
          Batafsil <Ic n="arrow" size={16} />
        </a>
      </div>
    </article>
  );
}

/* ---------- Services ---------- */
function Services() {
  const { query, setQuery, saved } = useApp();
  const [cat, setCat] = useState("all");
  const [onlySaved, setOnlySaved] = useState(false);
  const [onlyOnline, setOnlyOnline] = useState(false);
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SERVICES.filter(
      (s) =>
        (cat === "all" || s.cat === cat) &&
        (!onlySaved || saved.includes(s.id)) &&
        (!onlyOnline || s.online) &&
        (!q || (s.title + " " + s.agency + " " + catName(s.cat) + " " + s.docs.join(" ")).toLowerCase().includes(q)),
    );
  }, [query, cat, onlySaved, onlyOnline, saved]);
  return (
    <div className="wrap page">
      <PageHead
        kicker="Xizmatlar katalogi"
        title="Davlat xizmatlari"
        lead="Hujjatlar, qadamlar va mas'ul organlar. Qidiring yoki toifa tanlang."
      />
      <div className="toolbar">
        <div className="searchbar slim">
          <Ic n="search" />
          <label className="sr" htmlFor="sq">
            Qidirish
          </label>
          <input
            id="sq"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Xizmat nomi yoki hujjat boʻyicha qidiring"
          />
          {query && (
            <button className="iconbtn" aria-label="Tozalash" onClick={() => setQuery("")}>
              <Ic n="x" size={16} />
            </button>
          )}
        </div>
        <label className="check">
          <input type="checkbox" checked={onlyOnline} onChange={(e) => setOnlyOnline(e.target.checked)} /> Faqat onlayn
        </label>
        <label className="check">
          <input type="checkbox" checked={onlySaved} onChange={(e) => setOnlySaved(e.target.checked)} /> Saqlanganlar
        </label>
      </div>
      <div className="chips scroll">
        <button className={"chip" + (cat === "all" ? " on" : "")} onClick={() => setCat("all")}>
          Hammasi
        </button>
        {CATS.map((c) => (
          <button key={c[0]} className={"chip" + (cat === c[0] ? " on" : "")} onClick={() => setCat(c[0])}>
            {c[1]}
          </button>
        ))}
      </div>
      <p className="count">{list.length} ta xizmat topildi</p>
      {list.length ? (
        <div className="grid g3">
          {list.map((s) => (
            <ServiceCard key={s.id} s={s} />
          ))}
        </div>
      ) : (
        <Empty title="Hech narsa topilmadi" text="Qidiruv soʻzini oʻzgartiring yoki filtrlarni tozalang." />
      )}
    </div>
  );
}

function ServiceDetail({ id }) {
  const { saved, toggleSaved, checks, setChecks, setQueuePre } = useApp();
  const s = SERVICES.find((x) => x.id === id);
  if (!s)
    return (
      <div className="wrap page">
        <Empty
          title="Xizmat topilmadi"
          text="Bunday xizmat katalogda yoʻq."
          href="#xizmatlar"
          cta="Katalogga qaytish"
        />
      </div>
    );
  const done = checks[s.id] || [];
  const toggle = (i) => setChecks({ ...checks, [s.id]: done.includes(i) ? done.filter((x) => x !== i) : [...done, i] });
  const pct = Math.round((done.length / s.docs.length) * 100);
  const on = saved.includes(s.id);
  return (
    <div className="wrap page">
      <PageHead kicker={catName(s.cat)} title={s.title} lead={s.agency} />
      <div className="detail">
        <div className="col">
          <section className="panel">
            <div className="sechead">
              <h2>Kerakli hujjatlar</h2>
              <span className="muted">
                {done.length} / {s.docs.length}
              </span>
            </div>
            <div className="bar">
              <i style={{ width: pct + "%" }}></i>
            </div>
            <ul className="checklist">
              {s.docs.map((d, i) => (
                <li key={i}>
                  <label className={"cl" + (done.includes(i) ? " done" : "")}>
                    <input type="checkbox" checked={done.includes(i)} onChange={() => toggle(i)} />
                    <span>{d}</span>
                  </label>
                </li>
              ))}
            </ul>
            {pct === 100 && (
              <p className="okmsg">
                <Ic n="check" size={18} /> Hamma hujjatlar tayyor. Endi navbatga yozilishingiz mumkin.
              </p>
            )}
          </section>
          <section className="panel">
            <h2>Qadamlar</h2>
            <ol className="steps">
              {s.steps.map((t, i) => (
                <li key={i}>
                  <span className="stepno sm">{i + 1}</span>
                  <span>{t}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
        <aside className="col side">
          <section className="panel">
            <dl className="facts">
              <div>
                <dt>Muddat</dt>
                <dd>{s.time}</dd>
              </div>
              <div>
                <dt>Toʻlov</dt>
                <dd>{s.fee}</dd>
              </div>
              <div>
                <dt>Shakl</dt>
                <dd>{s.online ? "Onlayn ariza mumkin" : "Markazga borish kerak"}</dd>
              </div>
            </dl>
            <a className="btn block-btn" href="#navbat" onClick={() => setQueuePre(s.id)}>
              <Ic n="clock" size={18} /> Navbatga yozilish
            </a>
            <button className={"btn ghost block-btn"} onClick={() => toggleSaved(s.id)}>
              <Ic n="star" size={18} fill={on} /> {on ? "Saqlangan" : "Saqlab qoʻyish"}
            </button>
            <a className="btn ghost block-btn" href="https://my.gov.uz" target="_blank" rel="noopener noreferrer">
              Rasmiy portal <Ic n="ext" size={16} />
            </a>
          </section>
          <p className="note">
            Talablar va toʻlovlar oʻzgarishi mumkin. Topshirishdan oldin rasmiy manbada tekshiring.
          </p>
        </aside>
      </div>
    </div>
  );
}

/* ---------- Appeals ---------- */
function stageOf(a, now) {
  const sec = (now - a.created) / 1000;
  let st = 0;
  STAGE_AT.forEach((t, i) => {
    if (sec >= t) st = i;
  });
  return st;
}
function Appeals() {
  const { appeals, setAppeals, notify, now } = useApp();
  const empty = { name: "", phone: "", region: REGIONS[0], topic: TOPICS[0], text: "", anon: false };
  const [f, setF] = useState(empty);
  const [err, setErr] = useState({});
  const [created, setCreated] = useState(null);
  const [code, setCode] = useState("");
  const [found, setFound] = useState(null);
  const [searched, setSearched] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const submit = (e) => {
    e.preventDefault();
    const er = {};
    if (!f.anon) {
      if (f.name.trim().length < 3) er.name = "Ism va familiyani kiriting";
      if (!normPhone(f.phone)) er.phone = "Telefon raqami notoʻgʻri. Masalan: 90 123 45 67";
    }
    if (f.text.trim().length < 20) er.text = "Murojaat matni kamida 20 belgidan iborat boʻlsin";
    setErr(er);
    if (Object.keys(er).length) {
      notify("Maydonlarni tekshiring", "bad");
      return;
    }
    const ref = "M-" + new Date().getFullYear() + "-" + String(Math.floor(10000 + Math.random() * 89999));
    const a = {
      ref,
      name: f.anon ? "Anonim" : f.name.trim(),
      phone: f.anon ? "" : normPhone(f.phone),
      region: f.region,
      topic: f.topic,
      text: f.text.trim(),
      created: Date.now(),
    };
    setAppeals([a, ...appeals]);
    setCreated(a);
    setF(empty);
    notify("Murojaat qabul qilindi: " + ref, "ok");
  };
  const track = (e) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    setFound(appeals.find((a) => a.ref === c) || null);
    setSearched(true);
  };
  return (
    <div className="wrap page">
      <PageHead
        kicker="Murojaat"
        title="Murojaat yuborish va kuzatish"
        lead="Muammo yoki taklifingizni yozing. Sizga kuzatish raqami beriladi."
      />
      <div className="split">
        <form className="panel" onSubmit={submit} noValidate>
          <h2>Yangi murojaat</h2>
          <label className="check">
            <input id="anon" type="checkbox" checked={f.anon} onChange={set("anon")} /> Anonim yuborish
          </label>
          {!f.anon && (
            <div className="row2">
              <Field id="ap-name" label="Ism va familiya" error={err.name}>
                <input id="ap-name" value={f.name} onChange={set("name")} autoComplete="name" />
              </Field>
              <Field id="ap-phone" label="Telefon" error={err.phone} hint="+998 bilan yoki 9 raqam">
                <input
                  id="ap-phone"
                  value={f.phone}
                  onChange={set("phone")}
                  inputMode="tel"
                  placeholder="90 123 45 67"
                  autoComplete="tel"
                />
              </Field>
            </div>
          )}
          <div className="row2">
            <Field id="ap-region" label="Hudud">
              <select id="ap-region" value={f.region} onChange={set("region")}>
                {REGIONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </Field>
            <Field id="ap-topic" label="Mavzu">
              <select id="ap-topic" value={f.topic} onChange={set("topic")}>
                {TOPICS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field
            id="ap-text"
            label="Murojaat matni"
            error={err.text}
            hint={f.text.trim().length + " / kamida 20 belgi"}
          >
            <textarea
              id="ap-text"
              rows="6"
              value={f.text}
              onChange={set("text")}
              placeholder="Muammoni aniq yozing: qayerda, qachon va nima sodir boʻldi"
            ></textarea>
          </Field>
          <button className="btn" type="submit">
            Yuborish <Ic n="arrow" size={18} />
          </button>
          {created && (
            <div className="success" role="status">
              <b>Murojaatingiz qabul qilindi.</b>
              <p>
                Kuzatish raqami: <code>{created.ref}</code>
              </p>
              <button
                type="button"
                className="textlink"
                onClick={() => {
                  setCode(created.ref);
                  setFound(created);
                  setSearched(true);
                }}
              >
                Holatini koʻrish
              </button>
            </div>
          )}
        </form>

        <div className="col">
          <form className="panel" onSubmit={track}>
            <h2>Holatni kuzatish</h2>
            <Field id="tk" label="Kuzatish raqami">
              <input id="tk" value={code} onChange={(e) => setCode(e.target.value)} placeholder="M-2026-12345" />
            </Field>
            <button className="btn ghost" type="submit">
              Tekshirish
            </button>
            {searched && !found && (
              <p className="err" role="alert">
                Bunday raqam shu qurilmada topilmadi.
              </p>
            )}
            {found && <Timeline a={found} now={now} />}
          </form>
          <p className="note">
            Demo rejimi: holat bir necha soniya ichida oʻzgarib boradi. Haqiqiy murojaatlar uchun muddat qonunda
            belgilangan.
          </p>
        </div>
      </div>
      <section className="block">
        <div className="sechead">
          <h2>Mening murojaatlarim</h2>
        </div>
        {appeals.length ? (
          <div className="list">
            {appeals.map((a) => (
              <AppealRow key={a.ref} a={a} />
            ))}
          </div>
        ) : (
          <Empty title="Hali murojaat yoʻq" text="Birinchi murojaatingizni yuqoridagi shakl orqali yuboring." />
        )}
      </section>
    </div>
  );
}
function Timeline({ a, now }) {
  const st = stageOf(a, now);
  return (
    <div className="tl">
      <p className="tl-h">
        <code>{a.ref}</code> · {a.topic}
      </p>
      <ol>
        {STAGES.map((s, i) => (
          <li key={i} className={i < st ? "past" : i === st ? "cur" : ""}>
            <span className="dot">{i < st ? <Ic n="check" size={12} /> : ""}</span>
            {s}
          </li>
        ))}
      </ol>
      {st === 3 && <p className="okmsg">Javob tayyor. Odatda u telefon yoki xabarnoma orqali yuboriladi.</p>}
    </div>
  );
}
function AppealRow({ a }) {
  const { now, appeals, setAppeals } = useApp();
  const st = stageOf(a, now);
  const d = new Date(a.created);
  return (
    <article className="row">
      <div className="grow">
        <p className="rt">
          <code>{a.ref}</code> <span className={"badge" + (st === 3 ? " ok" : "")}>{STAGES[st]}</span>
        </p>
        <p>
          {a.topic} · {a.region}
        </p>
        <p className="muted clamp">{a.text}</p>
        <p className="muted sm">
          {d.getDate()}-{MONTHS[d.getMonth()]}, {String(d.getHours()).padStart(2, "0")}:
          {String(d.getMinutes()).padStart(2, "0")}
        </p>
      </div>
      <button
        className="iconbtn"
        aria-label="Oʻchirish"
        onClick={() => setAppeals(appeals.filter((x) => x.ref !== a.ref))}
      >
        <Ic n="trash" size={18} />
      </button>
    </article>
  );
}

/* ---------- Queue ---------- */
function slotsFor() {
  const out = [];
  for (let h = 9; h < 18; h++)
    for (const m of [0, 30]) {
      if (h === 13) continue;
      out.push(String(h).padStart(2, "0") + ":" + (m ? "30" : "00"));
    }
  return out;
}
function Queue() {
  const { bookings, setBookings, queuePre, notify } = useApp();
  const [region, setRegion] = useState(REGIONS[0]);
  const [branch, setBranch] = useState(BRANCHES[0]);
  const [service, setService] = useState(queuePre || SERVICES[0].id);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [last, setLast] = useState(null);
  useEffect(() => {
    if (queuePre) setService(queuePre);
  }, [queuePre]);

  const dates = useMemo(() => {
    const out = [];
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    for (let i = 0; out.length < 14 && i < 30; i++) {
      const x = new Date(d.getTime() + i * 86400000);
      if (x.getDay() !== 0) out.push(x);
    }
    return out;
  }, []);
  useEffect(() => {
    if (!date && dates.length) setDate(iso(dates[0]));
  }, [dates]);

  const now = new Date();
  const slots = slotsFor().map((t) => {
    const key = region + branch + date + t;
    const taken = bookings.some((b) => b.region === region && b.branch === branch && b.date === date && b.time === t);
    const busy = hash(key) % 4 === 0;
    let past = false;
    if (date === iso(now)) {
      const p = t.split(":").map(Number);
      past = p[0] * 60 + p[1] <= now.getHours() * 60 + now.getMinutes();
    }
    return { t, disabled: taken || busy || past, taken };
  });
  const free = slots.filter((s) => !s.disabled).length;
  const svc = SERVICES.find((s) => s.id === service);
  const book = () => {
    if (!date || !time) {
      notify("Sana va vaqtni tanlang", "bad");
      return;
    }
    const b = {
      id: "N" + Date.now(),
      code: "N-" + String(100 + (hash(region + branch + date + time) % 900)),
      region,
      branch,
      service,
      date,
      time,
    };
    setBookings([b, ...bookings]);
    setLast(b);
    setTime("");
    notify("Navbat band qilindi: " + b.code, "ok");
  };
  return (
    <div className="wrap page">
      <PageHead
        kicker="Onlayn navbat"
        title="Markazga navbatga yozilish"
        lead="Hudud, xizmat va qulay vaqtni tanlang. Navbat raqami sizga darhol beriladi."
      />
      <div className="split">
        <section className="panel">
          <h2>1. Xizmat va joy</h2>
          <Field id="q-svc" label="Xizmat">
            <select id="q-svc" value={service} onChange={(e) => setService(e.target.value)}>
              {SERVICES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </Field>
          <div className="row2">
            <Field id="q-reg" label="Hudud">
              <select
                id="q-reg"
                value={region}
                onChange={(e) => {
                  setRegion(e.target.value);
                  setTime("");
                }}
              >
                {REGIONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </Field>
            <Field id="q-br" label="Filial">
              <select
                id="q-br"
                value={branch}
                onChange={(e) => {
                  setBranch(e.target.value);
                  setTime("");
                }}
              >
                {BRANCHES.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </Field>
          </div>
          <h2>2. Sana</h2>
          <div className="dates">
            {dates.map((d) => (
              <button
                key={iso(d)}
                className={"date" + (date === iso(d) ? " on" : "")}
                onClick={() => {
                  setDate(iso(d));
                  setTime("");
                }}
              >
                <b>{d.getDate()}</b>
                <span>{DAYS[d.getDay()].slice(0, 3)}</span>
              </button>
            ))}
          </div>
          <div className="sechead tight">
            <h2>3. Vaqt</h2>
            <span className="muted">{free} ta boʻsh vaqt</span>
          </div>
          <div className="slots">
            {slots.map((s) => (
              <button
                key={s.t}
                disabled={s.disabled}
                className={"slot" + (time === s.t ? " on" : "")}
                aria-pressed={time === s.t}
                onClick={() => setTime(s.t)}
              >
                {s.t}
              </button>
            ))}
          </div>
          <p className="muted sm">Tushlik tanaffusi 13:00 dan 14:00 gacha.</p>
        </section>
        <div className="col">
          <section className="panel sticky">
            <h2>Navbat tafsilotlari</h2>
            <dl className="facts">
              <div>
                <dt>Xizmat</dt>
                <dd>{svc.title}</dd>
              </div>
              <div>
                <dt>Joy</dt>
                <dd>
                  {region}, {branch}
                </dd>
              </div>
              <div>
                <dt>Sana</dt>
                <dd>{date ? dtxt(parseIso(date)) : "Tanlanmagan"}</dd>
              </div>
              <div>
                <dt>Vaqt</dt>
                <dd>{time || "Tanlanmagan"}</dd>
              </div>
            </dl>
            <button className="btn block-btn" onClick={book} disabled={!time}>
              Navbatni band qilish
            </button>
            <a className="textlink" href={"#xizmat-" + svc.id}>
              Kerakli hujjatlarni koʻrish <Ic n="arrow" size={16} />
            </a>
            {last && (
              <div className="ticket" role="status">
                <span>Sizning navbatingiz</span>
                <b>{last.code}</b>
                <span>
                  {dtxt(parseIso(last.date))}, {last.time}
                </span>
              </div>
            )}
          </section>
        </div>
      </div>
      <section className="block">
        <div className="sechead">
          <h2>Mening navbatlarim</h2>
        </div>
        {bookings.length ? (
          <div className="list">
            {bookings.map((b) => {
              const s = SERVICES.find((x) => x.id === b.service);
              return (
                <article key={b.id} className="row">
                  <div className="grow">
                    <p className="rt">
                      <code>{b.code}</code>{" "}
                      <span className="badge ok">
                        {dtxt(parseIso(b.date))}, {b.time}
                      </span>
                    </p>
                    <p>{s ? s.title : ""}</p>
                    <p className="muted">
                      <Ic n="pin" size={14} /> {b.region}, {b.branch}
                    </p>
                  </div>
                  <button
                    className="btn ghost sm"
                    onClick={() => {
                      setBookings(bookings.filter((x) => x.id !== b.id));
                      notify("Navbat bekor qilindi");
                    }}
                  >
                    Bekor qilish
                  </button>
                </article>
              );
            })}
          </div>
        ) : (
          <Empty title="Faol navbat yoʻq" text="Yuqoridan sana va vaqtni tanlab band qiling." />
        )}
      </section>
    </div>
  );
}

/* ---------- Calculators ---------- */
function Num({ id, label, value, set, suffix, step, hint }) {
  return (
    <Field id={id} label={label} hint={hint}>
      <div className="inwrap">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min="0"
          step={step || "any"}
          value={value}
          onChange={(e) => set(e.target.value)}
        />
        {suffix && <span>{suffix}</span>}
      </div>
    </Field>
  );
}
const toN = (v) => {
  const n = parseFloat(v);
  return isFinite(n) && n >= 0 ? n : 0;
};
function Result({ rows, big }) {
  return (
    <div className="result">
      {big && (
        <div className="big">
          <span>{big[0]}</span>
          <b>{big[1]}</b>
        </div>
      )}
      <dl>
        {rows.map((r) => (
          <div key={r[0]}>
            <dt>{r[0]}</dt>
            <dd>{r[1]}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Salary() {
  const [g, setG] = useState("5000000");
  const gross = toN(g);
  const tax = gross * 0.12;
  const inps = gross * 0.001;
  const net = gross - tax - inps;
  return (
    <div className="split">
      <div className="panel">
        <h2>Maosh hisoblagichi</h2>
        <Num id="s-g" label="Hisoblangan oylik maosh" value={g} set={setG} suffix="soʻm" />
        <p className="note">
          Daromad soligʻi 12% va fuqarolarning pensiya badali 0,1% olinadi. Imtiyozlar va qoʻshimcha ushlanmalar hisobga
          olinmagan.
        </p>
      </div>
      <Result
        big={["Qoʻlga tegadi", fmt(net) + " soʻm"]}
        rows={[
          ["Daromad soligʻi (12%)", fmt(tax) + " soʻm"],
          ["Pensiya badali (0,1%)", fmt(inps) + " soʻm"],
          ["Jami ushlanma", fmt(tax + inps) + " soʻm"],
        ]}
      />
    </div>
  );
}
function Loan() {
  const [p, setP] = useState("50000000");
  const [r, setR] = useState("24");
  const [n, setN] = useState("24");
  const [kind, setKind] = useState("ann");
  const P = toN(p),
    N = Math.max(1, Math.round(toN(n))),
    m = toN(r) / 1200;
  const sched = useMemo(() => {
    const out = [];
    let bal = P;
    const pay = m === 0 ? P / N : (P * m) / (1 - Math.pow(1 + m, -N));
    for (let i = 1; i <= Math.min(N, 360); i++) {
      const interest = bal * m;
      const princ = kind === "ann" ? pay - interest : P / N;
      const total = princ + interest;
      bal = Math.max(0, bal - princ);
      out.push([i, total, princ, interest, bal]);
    }
    return out;
  }, [P, N, m, kind]);
  const total = sched.reduce((a, x) => a + x[1], 0);
  return (
    <div className="split">
      <div className="panel">
        <h2>Kredit hisoblagichi</h2>
        <Num id="l-p" label="Kredit summasi" value={p} set={setP} suffix="soʻm" />
        <div className="row2">
          <Num id="l-r" label="Yillik foiz" value={r} set={setR} suffix="%" />
          <Num id="l-n" label="Muddat" value={n} set={setN} suffix="oy" step="1" />
        </div>
        <div className="seg" role="group" aria-label="Toʻlov turi">
          <button className={kind === "ann" ? "on" : ""} aria-pressed={kind === "ann"} onClick={() => setKind("ann")}>
            Annuitet
          </button>
          <button
            className={kind === "diff" ? "on" : ""}
            aria-pressed={kind === "diff"}
            onClick={() => setKind("diff")}
          >
            Differensial
          </button>
        </div>
      </div>
      <div className="col">
        <Result
          big={[kind === "ann" ? "Oylik toʻlov" : "Birinchi oy toʻlovi", fmt(sched[0] ? sched[0][1] : 0) + " soʻm"]}
          rows={[
            ["Jami toʻlov", fmt(total) + " soʻm"],
            ["Ortiqcha toʻlov", fmt(total - P) + " soʻm"],
            ["Oxirgi oy toʻlovi", fmt(sched.length ? sched[sched.length - 1][1] : 0) + " soʻm"],
          ]}
        />
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Oy</th>
                <th>Toʻlov</th>
                <th>Asosiy qarz</th>
                <th>Foiz</th>
                <th>Qoldiq</th>
              </tr>
            </thead>
            <tbody>
              {sched.map((x) => (
                <tr key={x[0]}>
                  <td>{x[0]}</td>
                  <td>{fmt(x[1])}</td>
                  <td>{fmt(x[2])}</td>
                  <td>{fmt(x[3])}</td>
                  <td>{fmt(x[4])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
function Duty() {
  const [bhm, setBhm] = useState("375000");
  const [k, setK] = useState("1");
  const res = toN(bhm) * toN(k);
  return (
    <div className="split">
      <div className="panel">
        <h2>Davlat boji hisoblagichi</h2>
        <Num
          id="d-b"
          label="Bazaviy hisoblash miqdori (BHM)"
          value={bhm}
          set={setBhm}
          suffix="soʻm"
          hint="Joriy qiymatni rasmiy manbadan tekshirib kiriting"
        />
        <Num
          id="d-k"
          label="BHMga koeffitsiyent"
          value={k}
          set={setK}
          hint="Masalan: 0,5 yoki 2. Xizmat sahifasidagi boj miqdoriga qarab kiriting"
        />
        <p className="note">Hisoblagich faqat koʻpaytirishni bajaradi. Aniq boj miqdori xizmatga qarab belgilanadi.</p>
      </div>
      <Result
        big={["Davlat boji", fmt(res) + " soʻm"]}
        rows={[
          ["BHM", fmt(toN(bhm)) + " soʻm"],
          ["Koeffitsiyent", String(toN(k))],
        ]}
      />
    </div>
  );
}
function Utilities() {
  const [rows, setRows] = useState([
    { k: "Elektr energiyasi", u: "kVt·soat", q: "250", t: "1000" },
    { k: "Tabiiy gaz", u: "m³", q: "80", t: "1500" },
    { k: "Sovuq suv", u: "m³", q: "10", t: "2500" },
    { k: "Chiqindi yigʻish", u: "oy", q: "1", t: "6000" },
  ]);
  const upd = (i, key, v) => setRows(rows.map((r, j) => (j === i ? { ...r, [key]: v } : r)));
  const sum = rows.reduce((a, r) => a + toN(r.q) * toN(r.t), 0);
  return (
    <div className="split">
      <div className="panel">
        <h2>Kommunal toʻlovlar</h2>
        {rows.map((r, i) => (
          <div key={r.k} className="row2 tight">
            <Num id={"u-q" + i} label={r.k + " (" + r.u + ")"} value={r.q} set={(v) => upd(i, "q", v)} />
            <Num id={"u-t" + i} label="Tarif" value={r.t} set={(v) => upd(i, "t", v)} suffix="soʻm" />
          </div>
        ))}
        <p className="note">Tariflar namunaviy. Oʻzingizning hududingiz tarifini kiriting.</p>
      </div>
      <Result
        big={["Oylik jami", fmt(sum) + " soʻm"]}
        rows={rows.map((r) => [r.k, fmt(toN(r.q) * toN(r.t)) + " soʻm"])}
      />
    </div>
  );
}
function Pension() {
  const [dob, setDob] = useState("");
  const [sex, setSex] = useState("m");
  let out = null;
  if (dob) {
    const b = new Date(dob);
    const age = sex === "m" ? 60 : 55;
    const d = new Date(b.getFullYear() + age, b.getMonth(), b.getDate());
    const days = Math.ceil((d - new Date()) / 86400000);
    out = { d, days, age };
  }
  return (
    <div className="split">
      <div className="panel">
        <h2>Pensiya yoshi</h2>
        <Field id="p-dob" label="Tugʻilgan sana">
          <input id="p-dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
        </Field>
        <div className="seg" role="group" aria-label="Jins">
          <button className={sex === "m" ? "on" : ""} aria-pressed={sex === "m"} onClick={() => setSex("m")}>
            Erkak
          </button>
          <button className={sex === "f" ? "on" : ""} aria-pressed={sex === "f"} onClick={() => setSex("f")}>
            Ayol
          </button>
        </div>
        <p className="note">
          Yosh bilan birga ish staji sharti ham qoʻllanadi. Aniq maʼlumotni pensiya jamgʻarmasidan oling.
        </p>
      </div>
      {out ? (
        <Result
          big={[
            "Pensiya yoshiga yetish sanasi",
            out.d.getDate() + "-" + MONTHS[out.d.getMonth()] + " " + out.d.getFullYear(),
          ]}
          rows={[
            ["Pensiya yoshi", out.age + " yosh"],
            ["Holat", out.days > 0 ? "Yana " + fmt(out.days) + " kun qoldi" : "Pensiya yoshiga yetgan"],
          ]}
        />
      ) : (
        <Empty title="Sanani kiriting" text="Natija shu yerda koʻrinadi." />
      )}
    </div>
  );
}
function Calculators() {
  const tabs = [
    ["maosh", "Maosh", Salary],
    ["kredit", "Kredit", Loan],
    ["boj", "Davlat boji", Duty],
    ["kommunal", "Kommunal", Utilities],
    ["pensiya", "Pensiya", Pension],
  ];
  const [tab, setTab] = useStore("calc", "maosh");
  const T = (tabs.find((t) => t[0] === tab) || tabs[0])[2];
  return (
    <div className="wrap page">
      <PageHead
        kicker="Hisoblagichlar"
        title="Kundalik hisob-kitoblar"
        lead="Natijalar taxminiy va qaror qabul qilishdan oldin rasmiy manba bilan solishtirish uchun."
      />
      <div className="tabs" role="tablist">
        {tabs.map((t) => (
          <button
            key={t[0]}
            role="tab"
            aria-selected={tab === t[0]}
            className={tab === t[0] ? "on" : ""}
            onClick={() => setTab(t[0])}
          >
            {t[1]}
          </button>
        ))}
      </div>
      <T />
    </div>
  );
}

/* ---------- Initiatives ---------- */
function Initiatives() {
  const { votes, setVotes, props, setProps, notify } = useApp();
  const [txt, setTxt] = useState("");
  const [err, setErr] = useState("");
  const vote = (pid, i) => setVotes({ ...votes, [pid]: i });
  const undo = (pid) => {
    const v = { ...votes };
    delete v[pid];
    setVotes(v);
  };
  const add = (e) => {
    e.preventDefault();
    if (txt.trim().length < 10) {
      setErr("Taklif kamida 10 belgidan iborat boʻlsin");
      return;
    }
    setErr("");
    setProps([{ id: "t" + Date.now(), text: txt.trim(), likes: 0, liked: false }, ...props]);
    setTxt("");
    notify("Taklif qoʻshildi", "ok");
  };
  const like = (id) =>
    setProps(props.map((p) => (p.id === id ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p)));
  return (
    <div className="wrap page">
      <PageHead
        kicker="Mahalla tashabbuslari"
        title="Ovoz bering, taklif kiriting"
        lead="Yashash muhitini yaxshilash boʻyicha soʻrovlar. Har bir soʻrovda bitta ovoz berish mumkin."
      />
      <div className="grid g3 polls">
        {POLLS.map((p) => {
          const my = votes[p.id];
          const total = p.opts.reduce((a, o) => a + o[1], 0) + (my !== undefined ? 1 : 0);
          return (
            <section key={p.id} className="panel">
              <h2>{p.q}</h2>
              <div className="opts">
                {p.opts.map((o, i) => {
                  const n = o[1] + (my === i ? 1 : 0);
                  const pct = Math.round((n / total) * 100);
                  return (
                    <button
                      key={i}
                      className={"opt" + (my === i ? " on" : "")}
                      disabled={my !== undefined}
                      onClick={() => vote(p.id, i)}
                    >
                      <i style={{ width: (my !== undefined ? pct : 0) + "%" }}></i>
                      <span className="ol">{o[0]}</span>
                      {my !== undefined && <b>{pct}%</b>}
                    </button>
                  );
                })}
              </div>
              <div className="pfoot">
                <span className="muted sm">{fmt(total)} ovoz · namunaviy soʻrov</span>
                {my !== undefined && (
                  <button className="textlink" onClick={() => undo(p.id)}>
                    Ovozni qaytarish
                  </button>
                )}
              </div>
            </section>
          );
        })}
      </div>
      <section className="block">
        <div className="sechead">
          <h2>Mening takliflarim</h2>
        </div>
        <form className="panel inline" onSubmit={add}>
          <Field id="pr" label="Yangi taklif" error={err}>
            <textarea
              id="pr"
              rows="3"
              value={txt}
              onChange={(e) => setTxt(e.target.value)}
              placeholder="Masalan: Maktab oldiga yoritilgan piyodalar yoʻlagi qurilsin"
            ></textarea>
          </Field>
          <button className="btn" type="submit">
            Taklifni qoʻshish
          </button>
        </form>
        {props.length ? (
          <div className="list">
            {props.map((p) => (
              <article key={p.id} className="row">
                <p className="grow">{p.text}</p>
                <button
                  className={"btn ghost sm" + (p.liked ? " on" : "")}
                  aria-pressed={p.liked}
                  onClick={() => like(p.id)}
                >
                  Qoʻllayman · {p.likes}
                </button>
                <button
                  className="iconbtn"
                  aria-label="Oʻchirish"
                  onClick={() => setProps(props.filter((x) => x.id !== p.id))}
                >
                  <Ic n="trash" size={18} />
                </button>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}

/* ---------- Cabinet ---------- */
function Cabinet() {
  const { appeals, bookings, saved, toggleSaved, checks, resetAll } = useApp();
  const [sure, setSure] = useState(false);
  const savedS = saved.map((id) => SERVICES.find((s) => s.id === id)).filter(Boolean);
  const inProgress = Object.keys(checks)
    .map((id) => SERVICES.find((s) => s.id === id))
    .filter((s) => s && (checks[s.id] || []).length);
  return (
    <div className="wrap page">
      <PageHead
        kicker="Shaxsiy kabinet"
        title="Mening kabinetim"
        lead="Barcha ma'lumotlar faqat shu brauzerda saqlanadi."
      />
      <div className="grid g3">
        <section className="panel">
          <h2>Murojaatlar</h2>
          <p className="stat">{appeals.length}</p>
          <a className="textlink" href="#murojaat">
            Oʻtish <Ic n="arrow" size={16} />
          </a>
        </section>
        <section className="panel">
          <h2>Navbatlar</h2>
          <p className="stat">{bookings.length}</p>
          <a className="textlink" href="#navbat">
            Oʻtish <Ic n="arrow" size={16} />
          </a>
        </section>
        <section className="panel">
          <h2>Saqlangan xizmatlar</h2>
          <p className="stat">{saved.length}</p>
          <a className="textlink" href="#xizmatlar">
            Oʻtish <Ic n="arrow" size={16} />
          </a>
        </section>
      </div>
      <section className="block">
        <div className="sechead">
          <h2>Saqlangan xizmatlar</h2>
        </div>
        {savedS.length ? (
          <div className="list">
            {savedS.map((s) => (
              <article key={s.id} className="row">
                <div className="grow">
                  <p className="rt">
                    <a href={"#xizmat-" + s.id}>{s.title}</a>
                  </p>
                  <p className="muted">{s.agency}</p>
                </div>
                <button className="iconbtn" aria-label="Olib tashlash" onClick={() => toggleSaved(s.id)}>
                  <Ic n="x" size={18} />
                </button>
              </article>
            ))}
          </div>
        ) : (
          <Empty
            title="Saqlangan xizmat yoʻq"
            text="Xizmat kartasidagi yulduzchani bosing."
            href="#xizmatlar"
            cta="Xizmatlarga oʻtish"
          />
        )}
      </section>
      <section className="block">
        <div className="sechead">
          <h2>Hujjat tayyorlash jarayoni</h2>
        </div>
        {inProgress.length ? (
          <div className="list">
            {inProgress.map((s) => (
              <article key={s.id} className="row">
                <div className="grow">
                  <p className="rt">
                    <a href={"#xizmat-" + s.id}>{s.title}</a>
                  </p>
                  <div className="bar">
                    <i style={{ width: Math.round((checks[s.id].length / s.docs.length) * 100) + "%" }}></i>
                  </div>
                  <p className="muted sm">
                    {checks[s.id].length} / {s.docs.length} hujjat tayyor
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Empty title="Hali boshlanmagan" text="Xizmat sahifasida hujjatlarni belgilab boring." />
        )}
      </section>
      <section className="block panel danger">
        <h2>Maʼlumotlarni tozalash</h2>
        <p className="muted">Murojaatlar, navbatlar, belgilar va ovozlar shu qurilmadan oʻchiriladi.</p>
        {sure ? (
          <div className="rowbtn">
            <button
              className="btn danger-btn"
              onClick={() => {
                resetAll();
                setSure(false);
              }}
            >
              Ha, hammasini oʻchirish
            </button>
            <button className="btn ghost" onClick={() => setSure(false)}>
              Bekor qilish
            </button>
          </div>
        ) : (
          <button className="btn ghost" onClick={() => setSure(true)}>
            Hammasini oʻchirish
          </button>
        )}
      </section>
    </div>
  );
}

/* ---------- Shell ---------- */
const NAV = [
  ["xizmatlar", "Xizmatlar"],
  ["murojaat", "Murojaat"],
  ["navbat", "Navbat"],
  ["hisoblash", "Hisoblagichlar"],
  ["tashabbus", "Tashabbuslar"],
  ["kabinet", "Kabinetim"],
];

function Header({ route, theme, toggleTheme, size, cycleSize }) {
  const [open, setOpen] = useState(false);
  const [sc, setSc] = useState(false);
  useEffect(() => setOpen(false), [route]);
  useEffect(() => {
    const f = () => setSc(window.scrollY > 6);
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  const cur = route.startsWith("xizmat-") ? "xizmatlar" : route;
  return (
    <header className={"top" + (sc ? " sc" : "")}>
      <div className="wrap top-in">
        <a className="brand" href="#bosh" aria-label="Fuqaro Yoʻli bosh sahifa">
          <span className="logo" aria-hidden="true">
            <svg viewBox="0 0 32 32" width="28" height="28">
              <g fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="8" y="8" width="16" height="16" />
                <rect x="8" y="8" width="16" height="16" transform="rotate(45 16 16)" />
              </g>
            </svg>
          </span>
          <span>Fuqaro Yoʻli</span>
        </a>
        <nav className={"nav" + (open ? " open" : "")} aria-label="Asosiy menyu">
          {NAV.map((n) => (
            <a
              key={n[0]}
              href={"#" + n[0]}
              className={cur === n[0] ? "on" : ""}
              aria-current={cur === n[0] ? "page" : undefined}
            >
              {n[1]}
            </a>
          ))}
        </nav>
        <div className="tools">
          <button
            className="iconbtn txt"
            onClick={cycleSize}
            aria-label="Matn oʻlchamini oʻzgartirish"
            title="Matn oʻlchami"
          >
            A{"+".repeat(size)}
          </button>
          <button className="iconbtn" onClick={toggleTheme} aria-label="Mavzuni almashtirish">
            <Ic n={theme === "dark" ? "sun" : "moon"} />
          </button>
          <button className="iconbtn burger" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Menyu">
            <Ic n={open ? "x" : "menu"} />
          </button>
        </div>
      </div>
    </header>
  );
}

function App() {
  const route = useRoute();
  const [theme, setTheme] = useStore("theme", null);
  const [size, setSize] = useStore("size", 0);
  const [appeals, setAppeals] = useStore("appeals", []);
  const [bookings, setBookings] = useStore("bookings", []);
  const [saved, setSaved] = useStore("saved", []);
  const [checks, setChecks] = useStore("checks", {});
  const [votes, setVotes] = useStore("votes", {});
  const [props, setProps] = useStore("props", []);
  const [query, setQuery] = useState("");
  const [queuePre, setQueuePre] = useState("");
  const [toast, setToast] = useState(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 3000);
    return () => clearInterval(t);
  }, []);
  const sysDark = () => window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const eff = theme || (sysDark() ? "dark" : "light");
  useEffect(() => {
    if (theme) document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
  useEffect(() => {
    document.documentElement.setAttribute("data-size", String(size));
  }, [size]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const notify = (msg, type) => setToast({ msg, type: type || "", k: Date.now() });
  const toggleSaved = (id) => setSaved(saved.includes(id) ? saved.filter((x) => x !== id) : [...saved, id]);
  const resetAll = () => {
    setAppeals([]);
    setBookings([]);
    setSaved([]);
    setChecks({});
    setVotes({});
    setProps([]);
    notify("Maʼlumotlar tozalandi");
  };

  const ctx = {
    appeals,
    setAppeals,
    bookings,
    setBookings,
    saved,
    toggleSaved,
    checks,
    setChecks,
    votes,
    setVotes,
    props,
    setProps,
    query,
    setQuery,
    queuePre,
    setQueuePre,
    notify,
    now,
    resetAll,
  };
  let page;
  if (route.startsWith("xizmat-")) page = <ServiceDetail id={route.slice(7)} />;
  else if (route === "xizmatlar") page = <Services />;
  else if (route === "murojaat") page = <Appeals />;
  else if (route === "navbat") page = <Queue />;
  else if (route === "hisoblash") page = <Calculators />;
  else if (route === "tashabbus") page = <Initiatives />;
  else if (route === "kabinet") page = <Cabinet />;
  else page = <Home />;

  return (
    <Ctx.Provider value={ctx}>
      <Header
        route={route}
        theme={eff}
        toggleTheme={() => setTheme(eff === "dark" ? "light" : "dark")}
        size={size}
        cycleSize={() => setSize((size + 1) % 3)}
      />
      {route !== "bosh" && <BackBar route={route} />}
      <main id="main" key={route} className="page-enter">
        {page}
      </main>
      <footer className="foot">
        <div className="wrap foot-grid">
          <div className="foot-brand">
            <span className="brand-s">
              <span className="logo sm" aria-hidden="true">
                <svg viewBox="0 0 32 32" width="20" height="20">
                  <g fill="none" stroke="currentColor" strokeWidth="2.2">
                    <rect x="8" y="8" width="16" height="16" />
                    <rect x="8" y="8" width="16" height="16" transform="rotate(45 16 16)" />
                  </g>
                </svg>
              </span>
              Fuqaro Yoʻli
            </span>
            <p className="muted">
              Namunaviy loyiha. Rasmiy davlat portali emas va davlat tizimlariga ulanmagan. Maʼlumotlar faqat sizning
              brauzeringizda saqlanadi.
            </p>
          </div>
          <nav className="foot-col" aria-label="Boʻlimlar">
            <h4>Boʻlimlar</h4>
            {NAV.slice(0, 3).map((n) => (
              <a key={n[0]} href={"#" + n[0]}>
                {n[1]}
              </a>
            ))}
          </nav>
          <nav className="foot-col" aria-label="Boshqa boʻlimlar">
            <h4>Yana</h4>
            {NAV.slice(3).map((n) => (
              <a key={n[0]} href={"#" + n[0]}>
                {n[1]}
              </a>
            ))}
          </nav>
          <div className="foot-col">
            <h4>Rasmiy manba</h4>
            <a href="https://my.gov.uz" target="_blank" rel="noopener noreferrer">
              my.gov.uz <Ic n="ext" size={14} />
            </a>
          </div>
        </div>
      </footer>
      <div className="toasts" aria-live="polite">
        {toast && (
          <div key={toast.k} className={"toast " + toast.type}>
            {toast.msg}
          </div>
        )}
      </div>
    </Ctx.Provider>
  );
}

createRoot(document.getElementById("root")).render(<App />);


export default App;