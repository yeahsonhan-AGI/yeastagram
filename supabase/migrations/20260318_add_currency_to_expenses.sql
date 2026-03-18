-- Add currency column with default value for backward compatibility
ALTER TABLE public.group_expenses
ADD COLUMN currency TEXT NOT NULL DEFAULT 'CNY';

-- Add check constraint for valid currencies
ALTER TABLE public.group_expenses
ADD CONSTRAINT valid_currency
CHECK (currency IN ('CNY', 'USD', 'IDR', 'JPY', 'KRW', 'GBP', 'EUR'));
