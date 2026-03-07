-- Reduce default starting credits to 100 to force engagement with upgrade flow
ALTER TABLE organizations ALTER COLUMN credit_balance SET DEFAULT 100;
ALTER TABLE organizations ALTER COLUMN monthly_credit_limit SET DEFAULT 100;
