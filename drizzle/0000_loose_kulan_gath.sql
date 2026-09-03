CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`property_id` text NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`mime_type` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`property_id` text NOT NULL,
	`unit_id` text,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`amount` real NOT NULL,
	`currency` text DEFAULT 'NGN' NOT NULL,
	`expense_date` integer NOT NULL,
	`vendor` text,
	`reference` text,
	`receipt_url` text,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `expense_date_idx` ON `expenses` (`expense_date`);--> statement-breakpoint
CREATE TABLE `leases` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`property_id` text NOT NULL,
	`unit_id` text,
	`start_date` integer NOT NULL,
	`end_date` integer NOT NULL,
	`monthly_rent` real NOT NULL,
	`security_deposit` real,
	`currency` text DEFAULT 'NGN' NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`notes` text,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`property_id` text NOT NULL,
	`unit_id` text,
	`lease_id` text,
	`obligation_id` text,
	`amount` real NOT NULL,
	`payment_date` integer,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`method` text DEFAULT 'BANK_TRANSFER' NOT NULL,
	`reference` text,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`lease_id`) REFERENCES `leases`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`obligation_id`) REFERENCES `rent_obligations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `payment_date_idx` ON `payments` (`payment_date`);--> statement-breakpoint
CREATE TABLE `properties` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`city` text,
	`state` text,
	`address` text NOT NULL,
	`country` text DEFAULT 'Nigeria' NOT NULL,
	`property_type_id` text NOT NULL,
	`number_of_units` integer DEFAULT 0 NOT NULL,
	`purchase_price` real,
	`current_value` real,
	`currency` text DEFAULT 'NGN' NOT NULL,
	`status` text DEFAULT 'VACANT' NOT NULL,
	`acquisition_date` integer,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`property_type_id`) REFERENCES `property_types`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `property_field_values` (
	`id` text PRIMARY KEY NOT NULL,
	`property_id` text NOT NULL,
	`field_id` text NOT NULL,
	`value` text NOT NULL,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`field_id`) REFERENCES `property_type_fields`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `property_field_values_property_id_field_id_unique` ON `property_field_values` (`property_id`,`field_id`);--> statement-breakpoint
CREATE TABLE `property_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`property_id` text NOT NULL,
	`url` text NOT NULL,
	`caption` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `property_type_fields` (
	`id` text PRIMARY KEY NOT NULL,
	`property_type_id` text NOT NULL,
	`name` text NOT NULL,
	`key` text NOT NULL,
	`field_type` text NOT NULL,
	`required` integer DEFAULT false,
	`options` text,
	FOREIGN KEY (`property_type_id`) REFERENCES `property_types`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `property_type_fields_property_type_id_key_unique` ON `property_type_fields` (`property_type_id`,`key`);--> statement-breakpoint
CREATE TABLE `property_types` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `property_types_name_unique` ON `property_types` (`name`);--> statement-breakpoint
CREATE TABLE `rent_obligations` (
	`id` text PRIMARY KEY NOT NULL,
	`property_id` text NOT NULL,
	`unit_id` text,
	`lease_id` text NOT NULL,
	`period_start` integer NOT NULL,
	`period_end` integer NOT NULL,
	`due_date` integer NOT NULL,
	`amount_due` real NOT NULL,
	`amount_paid` real DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'DUE' NOT NULL,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`lease_id`) REFERENCES `leases`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `due_date_status_idx` ON `rent_obligations` (`due_date`,`status`);--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`phone` text NOT NULL,
	`property_id` text NOT NULL,
	`monthly_rent` real NOT NULL,
	`security_deposit` real NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `units` (
	`id` text PRIMARY KEY NOT NULL,
	`property_id` text NOT NULL,
	`unit_number` text NOT NULL,
	`unit_type` text,
	`floor` text,
	`bedrooms` integer,
	`bathrooms` integer,
	`size` real,
	`monthly_rent` real,
	`currency` text DEFAULT 'NGN' NOT NULL,
	`status` text DEFAULT 'VACANT' NOT NULL,
	`notes` text,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `units_property_id_unit_number_unique` ON `units` (`property_id`,`unit_number`);