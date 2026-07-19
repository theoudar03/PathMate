DO $$
DECLARE
    r RECORD;
    random_days INT;
    random_steps TEXT[] := ARRAY[
        'Register online via portal -> Pay fee 100 INR -> Collect badge at Room 101',
        'Submit physical form to HOD -> Attend interview -> Get confirmation mail',
        'Scan QR code at notice board -> Fill Google Form -> Join WhatsApp group',
        'Enroll through student dashboard -> Complete pre-assessment -> Await selection',
        'Visit club coordinator -> Submit 2 passport photos -> Pay 50 INR fee'
    ];
    step_idx INT;
BEGIN
    -- Assign random dates to events
    FOR r IN SELECT id FROM events LOOP
        random_days := floor(random() * 60) + 1;
        UPDATE events 
        SET event_date = CURRENT_TIMESTAMP + (random_days || ' days')::interval,
            registration_deadline = CURRENT_TIMESTAMP + ((random_days - 3) || ' days')::interval
        WHERE id = r.id;
    END LOOP;

    -- Clear old processes
    DELETE FROM registration_process;

    -- Assign random registration steps to clubs
    FOR r IN SELECT id FROM clubs LOOP
        step_idx := floor(random() * 5) + 1;
        INSERT INTO registration_process (club_or_event_type, club_or_event_id, raw_process_text)
        VALUES ('club', r.id, random_steps[step_idx]);
    END LOOP;

    -- Assign random registration steps to events
    FOR r IN SELECT id FROM events LOOP
        step_idx := floor(random() * 5) + 1;
        INSERT INTO registration_process (club_or_event_type, club_or_event_id, raw_process_text)
        VALUES ('event', r.id, random_steps[step_idx]);
    END LOOP;
END $$;
