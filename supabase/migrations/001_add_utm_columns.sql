-- Add missing UTM/tracking columns to businesses table
-- Run this in Supabase SQL Editor if you already ran the initial schema

alter table businesses add column if not exists utm_campaign text;
alter table businesses add column if not exists utm_term text;
alter table businesses add column if not exists utm_content text;
alter table businesses add column if not exists gclid text;
alter table businesses add column if not exists fbclid text;
alter table businesses add column if not exists landing_page text;
alter table businesses add column if not exists referrer text;
