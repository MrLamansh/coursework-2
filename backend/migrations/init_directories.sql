-- ============================================
-- Инициализация справочников (reference data)
-- ============================================

-- Статусы доменов
INSERT INTO public.domain_statuses (name) VALUES
('Активен'),
('Просрочен'),
('Истекает сегодня'),
('На продление'),
('Зарезервирован'),
('Удалён')
ON CONFLICT (name) DO NOTHING;

-- Типы событий доменов
INSERT INTO public.event_types (name) VALUES
('Создание'),
('Автоматическое продление'),
('Смена статуса'),
('Истечение домена'),
('Восстановление'),
('Трансфер'),
('Комментарий')
ON CONFLICT (name) DO NOTHING;

-- Регистраторы доменов
INSERT INTO public.registrars (name, website_url) VALUES
('Яндекс.Домены', 'https://domains.yandex.com'),
('REG.COM', 'https://www.reg.com'),
('Beget', 'https://beget.com'),
('Hostinger', 'https://www.hostinger.ru'),
('Timeweb', 'https://timeweb.com'),
('Webnames', 'https://www.webnames.ru'),
('RU-CENTER', 'https://www.nic.ru'),
('GoDaddy', 'https://www.godaddy.com'),
('Namecheap', 'https://www.namecheap.com'),
('Google Domains', 'https://domains.google.com')
ON CONFLICT (name) DO NOTHING;

-- Статусы договоров
INSERT INTO public.contract_statuses (name) VALUES
('Активен'),
('На согласовании'),
('Завершён'),
('Приостановлен'),
('Отменён')
ON CONFLICT (name) DO NOTHING;

-- Типы платежей
INSERT INTO public.payment_types (name) VALUES
('Продление домена'),
('Регистрация домена'),
('Хостинг'),
('SSL сертификат'),
('Техническая поддержка'),
('Миграция домена'),
('WHOIS защита'),
('Возврат средств'),
('Штраф'),
('Прочее')
ON CONFLICT (name) DO NOTHING;

-- Статусы платежей
INSERT INTO public.payment_statuses (name) VALUES
('Ожидает оплаты'),
('Оплачен'),
('Отклонен'),
('Возвращен'),
('Частично оплачен')
ON CONFLICT (name) DO NOTHING;

-- Статусы заявок
INSERT INTO public.request_statuses (name) VALUES
('Открыта'),
('В работе'),
('На утверждении'),
('Завершена'),
('Отклонена'),
('Отложена')
ON CONFLICT (name) DO NOTHING;

-- Типы заявок
INSERT INTO public.request_types (name) VALUES
('Регистрация домена'),
('Продление домена'),
('Трансфер домена'),
('Изменение данных регистранта'),
('Восстановление домена'),
('Удаление домена'),
('Смена регистратора'),
('Смена DNS'),
('Техническая поддержка'),
('Консультация')
ON CONFLICT (name) DO NOTHING;

