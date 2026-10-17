-- Researched listings: taxi and airport-transfer operators, batch 1 (checked 17 October 2026).
--
-- Each listing uses only facts the business publishes itself (its own website or
-- business page, or the Grenada Tourism Authority directory), recorded with the source.
-- Discovery sites (Google, TripAdvisor, Viator) were used only to find businesses;
-- none of their reviews, ratings or photos are used.
--
-- Listings are imported as UNCLAIMED and PENDING REVIEW: they appear in /admin for you to
-- check (ideally by calling or messaging the business) before approving them.
-- Run this in the Supabase SQL Editor after the migrations and seed.

do $$
declare v uuid;
begin
  -- GRENADA ---------------------------------------------------------------
  perform public.create_business_core(jsonb_build_object(
    'country','gd','island','grenada','district','st-george',
    'name','Grenada Airport Taxi Association',
    'tagline','Taxi association serving arrivals at Maurice Bishop International Airport',
    'landmark','Maurice Bishop International Airport, Point Salines',
    'phone','+14734158977','website','https://www.grenada-airport.com/taxi.php',
    'categories',jsonb_build_array('airport-transfers','taxis'),
    'sourceUrl','https://www.puregrenada.com/grenada-airport-taxi-association/',
    'sourceNote','Grenada Tourism Authority directory listing','sourceCheckedAt','2026-10-17'
  ), 'pending_review', 'unclaimed', null);

  perform public.create_business_core(jsonb_build_object(
    'country','gd','island','grenada','district','st-george',
    'name','Sweet Grenada Tours, Taxi and Rentals',
    'tagline','Private tours, airport transfers and taxi service',
    'landmark','St. George',
    'phone','+14734105002','whatsapp','+14735335000','website','https://sweetgrenadatoursandtaxi.com/',
    'categories',jsonb_build_array('tours','airport-transfers','taxis'),
    'sourceUrl','https://sweetgrenadatoursandtaxi.com/',
    'sourceNote','Business website (lists phone/WhatsApp numbers)','sourceCheckedAt','2026-10-17'
  ), 'pending_review', 'unclaimed', null);

  perform public.create_business_core(jsonb_build_object(
    'country','gd','island','grenada','district','st-george',
    'name','Jeffrey Taxi',
    'tagline','Airport and marina transfers, taxi rides and island tours',
    'landmark','St. George’s',
    'phone','+14734187159','whatsapp','+14734187159','website','https://jeffreytaxi.com/',
    'categories',jsonb_build_array('taxis','airport-transfers','tours'),
    'sourceUrl','https://jeffreytaxi.com/',
    'sourceNote','Business website (number stated as also on WhatsApp)','sourceCheckedAt','2026-10-17'
  ), 'pending_review', 'unclaimed', null);

  perform public.create_business_core(jsonb_build_object(
    'country','gd','island','grenada','district','',
    'name','Ace Ventura Taxi & Tours',
    'tagline','Airport and cruise transfers, taxi rides, island tours and waterfall hikes',
    'phone','+14734594941','email','info@aceventuratours.com','website','https://www.aceventuratours.com/',
    'categories',jsonb_build_array('taxis','airport-transfers','tours'),
    'sourceUrl','https://www.aceventuratours.com/',
    'sourceNote','Business website','sourceCheckedAt','2026-10-17'
  ), 'pending_review', 'unclaimed', null);

  perform public.create_business_core(jsonb_build_object(
    'country','gd','island','grenada','district','',
    'name','Land and Sea Grenada Tours',
    'tagline','Airport transfers, island tours and day trips',
    'phone','+14734169979','website','https://landandseagrenadatours.com',
    'categories',jsonb_build_array('airport-transfers','tours','taxis'),
    'sourceUrl','https://landandseagrenadatours.com/grenada-airport-transfers-start-your-trip-right-with-grenada-tours/',
    'sourceNote','Business website. Confirm trading name: the site also calls itself "Grenada Tours".','sourceCheckedAt','2026-10-17'
  ), 'pending_review', 'unclaimed', null);

  perform public.create_business_core(jsonb_build_object(
    'country','gd','island','grenada','district','st-george',
    'name','See Grenada Tours',
    'tagline','Airport taxi, island-wide transfers and private tours',
    'landmark','St. George’s',
    'website','https://seegrenadatours.com/',
    'categories',jsonb_build_array('taxis','airport-transfers','tours'),
    'sourceUrl','https://seegrenadatours.com/',
    'sourceNote','Business website. Phone/WhatsApp number not captured; add it from the site before approving.','sourceCheckedAt','2026-10-17'
  ), 'pending_review', 'unclaimed', null);

  -- ST. VINCENT ----------------------------------------------------------
  v := public.create_business_core(jsonb_build_object(
    'country','vc','island','st-vincent','district','',
    'name','Trubb Taxi Tours SVG',
    'tagline','Airport transfers from Argyle and island tours',
    'phone','+17844939852','email','minibus090@gmail.com','website','https://www.trubbtaxitourssvg.com',
    'categories',jsonb_build_array('airport-transfers','taxis','tours'),
    'sourceUrl','https://www.trubbtaxitourssvg.com/airport-transfers',
    'sourceNote','Business website, including its own published airport rates (registered business no. 0462-2023)','sourceCheckedAt','2026-10-17'
  ), 'pending_review', 'unclaimed', null);
  -- The operator's own published rates, for 1 to 3 passengers.
  insert into public.services (business_id, name, description, price_min, price_unit, booking_models, sort_order) values
    (v, 'Argyle Airport to Villa', 'Operator’s published rate for 1–3 passengers', 80, 'trip', '{enquiry,appointment}', 1),
    (v, 'Argyle Airport to Kingstown', 'Operator’s published rate for 1–3 passengers', 106, 'trip', '{enquiry,appointment}', 2),
    (v, 'Argyle Airport to Campden Park', 'Operator’s published rate for 1–3 passengers', 115, 'trip', '{enquiry,appointment}', 3),
    (v, 'Argyle Airport to Questelles', 'Operator’s published rate for 1–3 passengers', 118, 'trip', '{enquiry,appointment}', 4);

  perform public.create_business_core(jsonb_build_object(
    'country','vc','island','st-vincent','district','charlotte',
    'name','Caricommute St. Vincent Premium Taxi & Tours',
    'tagline','Airport transfers with meet and greet, booked by destination or by the hour',
    'landmark','Argyle International Airport',
    'phone','+17844946496','email','support@caricommute.com','website','https://caricommute.com',
    'categories',jsonb_build_array('airport-transfers','taxis','tours'),
    'sourceUrl','https://www.facebook.com/caricommute',
    'sourceNote','Business Facebook page (links to caricommute.com)','sourceCheckedAt','2026-10-17'
  ), 'pending_review', 'unclaimed', null);

  perform public.create_business_core(jsonb_build_object(
    'country','vc','island','st-vincent','district','st-george',
    'name','Stefano Taxi Service & Tours',
    'tagline','Taxi service, island tours and airport pick-up and drop-off',
    'landmark','Kingstown',
    'phone','+17845319367','email','stefano-taxi-service@outlook.com',
    'categories',jsonb_build_array('taxis','airport-transfers','tours'),
    'sourceUrl','https://www.facebook.com/StefanoTaxiServiceandtours/',
    'sourceNote','Business Facebook page','sourceCheckedAt','2026-10-17'
  ), 'pending_review', 'unclaimed', null);
end $$;
