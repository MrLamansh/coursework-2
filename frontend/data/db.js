// data/db.js — Хранилище данных в памяти браузера
// В реальном проекте здесь были бы API-запросы к серверу.
// Каждый массив — аналог таблицы в реляционной БД.
// Связи: поле client (id) — аналог FOREIGN KEY.

let domains = [
  { id:1,  name:'aytisinformatics.ru',  client:1, registrar:'REG.RU',    regDate:'2022-03-15', expDate:'2026-05-15', price:1200, status:'expiring', note:'Основной сайт' },
  { id:2,  name:'aytisinformatics.com', client:1, registrar:'REG.RU',    regDate:'2022-03-15', expDate:'2026-05-30', price:1800, status:'expiring', note:'Международная версия' },
  { id:3,  name:'permnetzhal.ru',       client:2, registrar:'Selectel',  regDate:'2023-01-10', expDate:'2026-12-10', price:990,  status:'active',   note:'' },
  { id:4,  name:'permnetzhal.com',      client:2, registrar:'Selectel',  regDate:'2023-01-10', expDate:'2027-01-10', price:1500, status:'active',   note:'' },
  { id:5,  name:'itmedia-perm.ru',      client:3, registrar:'RU-CENTER', regDate:'2021-07-01', expDate:'2026-04-01', price:1100, status:'expired',  note:'Требует продления' },
  { id:6,  name:'soft-solutions.ru',    client:4, registrar:'Beget',     regDate:'2024-02-20', expDate:'2027-02-20', price:1200, status:'active',   note:'' },
  { id:7,  name:'perm-digital.ru',      client:5, registrar:'TimeWeb',   regDate:'2023-06-05', expDate:'2026-06-05', price:890,  status:'expiring', note:'Уведомить клиента' },
  { id:8,  name:'tehno-servis59.ru',    client:6, registrar:'REG.RU',    regDate:'2022-11-15', expDate:'2026-04-20', price:1200, status:'expired',  note:'' },
  { id:9,  name:'mediagroup-perm.ru',   client:7, registrar:'Selectel',  regDate:'2024-09-01', expDate:'2027-09-01', price:1100, status:'active',   note:'' },
  { id:10, name:'lawfirm-ural.ru',      client:8, registrar:'RU-CENTER', regDate:'2023-05-12', expDate:'2026-07-12', price:1200, status:'active',   note:'' },
];

let clients = [
  { id:1, name:'ООО Айтис Информатика', contact:'Морозов А.В.',  email:'info@aytisinformatics.ru', phone:'+7 342 200-11-22', inn:'5902345678' },
  { id:2, name:'ЗАО ПермНетЖал',        contact:'Белова О.С.',   email:'biz@permnetzhal.ru',       phone:'+7 342 211-33-44', inn:'5900112233' },
  { id:3, name:'ООО ИТ Медиа',          contact:'Сидоров И.П.',  email:'admin@itmedia-perm.ru',    phone:'+7 342 222-55-66', inn:'5904001122' },
  { id:4, name:'СофтСолюшенс',          contact:'Козлов В.Р.',   email:'hello@soft-solutions.ru',  phone:'+7 912 345-67-89', inn:'5906776655' },
  { id:5, name:'Пермь Диджитал',        contact:'Попова Н.В.',   email:'np@perm-digital.ru',       phone:'+7 342 290-01-23', inn:'5903221144' },
  { id:6, name:'ТехноСервис 59',        contact:'Никитин Д.Г.',  email:'d.nikitin@tehno59.ru',     phone:'+7 342 244-55-00', inn:'5901334455' },
  { id:7, name:'МедиаГрупп Пермь',      contact:'Харламова Т.С.',email:'media@mgrp.ru',            phone:'+7 342 299-88-77', inn:'5908765432' },
  { id:8, name:'ЮрФирм Урал',           contact:'Граков С.В.',   email:'law@ural-law.ru',          phone:'+7 342 255-11-99', inn:'5907654321' },
];

let requests = [
  { id:1, type:'renewal',      client:1, domain:'aytisinformatics.ru', date:'2026-04-01', status:'in_progress', assignee:'Петров А.',  desc:'Продление на 1 год' },
  { id:2, type:'registration', client:4, domain:'soft-solutions59.ru', date:'2026-04-05', status:'new',         assignee:'',           desc:'Регистрация нового домена' },
  { id:3, type:'renewal',      client:3, domain:'itmedia-perm.ru',     date:'2026-04-06', status:'new',         assignee:'',           desc:'Срочное продление' },
  { id:4, type:'change',       client:2, domain:'permnetzhal.ru',      date:'2026-03-28', status:'completed',   assignee:'Морозов А.', desc:'Смена DNS-серверов' },
  { id:5, type:'renewal',      client:5, domain:'perm-digital.ru',     date:'2026-04-07', status:'new',         assignee:'',           desc:'Плановое продление' },
  { id:6, type:'renewal',      client:6, domain:'tehno-servis59.ru',   date:'2026-04-06', status:'in_progress', assignee:'Петров А.',  desc:'Просрочен, срочное продление' },
];

const contracts = [
  { id:1, client:1, date:'2022-03-10', terms:'ежегодно',     status:'active' },
  { id:2, client:2, date:'2023-01-05', terms:'ежегодно',     status:'active' },
  { id:3, client:3, date:'2021-06-20', terms:'ежекварт.',    status:'active' },
  { id:4, client:4, date:'2024-02-15', terms:'ежегодно',     status:'active' },
  { id:5, client:5, date:'2023-05-30', terms:'ежемесячно',   status:'active' },
  { id:6, client:7, date:'2024-08-25', terms:'ежегодно',     status:'active' },
];

const payments = [
  { id:1, date:'2026-04-01', domain:'aytisinformatics.ru', client:1, amount:1200, type:'renewal',      status:'pending'   },
  { id:2, date:'2026-03-15', domain:'permnetzhal.ru',      client:2, amount:990,  type:'renewal',      status:'confirmed' },
  { id:3, date:'2026-03-10', domain:'soft-solutions.ru',   client:4, amount:1200, type:'renewal',      status:'confirmed' },
  { id:4, date:'2026-04-06', domain:'itmedia-perm.ru',     client:3, amount:1100, type:'renewal',      status:'pending'   },
  { id:5, date:'2026-02-20', domain:'mediagroup-perm.ru',  client:7, amount:1100, type:'registration', status:'confirmed' },
  { id:6, date:'2026-01-10', domain:'permnetzhal.com',     client:2, amount:1500, type:'renewal',      status:'confirmed' },
];

const activity = [
  { type:'primary', title:'Создана заявка #6 на продление',         meta:'8 апреля 2026, 14:32' },
  { type:'error',   title:'Домен itmedia-perm.ru просрочен',         meta:'8 апреля 2026, 10:00' },
  { type:'success', title:'Получена оплата от ООО Айтис',            meta:'7 апреля 2026, 17:20' },
  { type:'warning', title:'Домен perm-digital.ru истекает через 58 дн.', meta:'7 апреля 2026, 09:00' },
  { type:'success', title:'Смена DNS для permnetzhal.ru выполнена',  meta:'6 апреля 2026, 13:15' },
  { type:'primary', title:'Новый клиент: МедиаГрупп Пермь',         meta:'5 апреля 2026, 11:00' },
];

// Счётчики автоинкремента (аналог AUTO_INCREMENT в SQL)
const nextIds = { domain:11, client:9, request:7, contract:7, payment:7 };
