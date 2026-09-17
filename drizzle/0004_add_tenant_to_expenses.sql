ALTER TABLE `expenses` ADD COLUMN `tenant_id` text REFERENCES `tenants`(`id`);
