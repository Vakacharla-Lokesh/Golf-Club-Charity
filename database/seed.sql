-- Seed demo charities
INSERT INTO charities (id, name, description, image_url, is_featured, is_active, created_at, updated_at)
VALUES 
  (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Doctors Without Borders',
    'International humanitarian organization providing medical assistance in conflict zones and disaster areas.',
    'https://via.placeholder.com/300x200?text=MSF',
    true,
    true,
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000002'::uuid,
    'The Nature Conservancy',
    'Global organization dedicated to protecting lands and waters that harbour the diversity of life.',
    'https://via.placeholder.com/300x200?text=Nature',
    true,
    true,
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000003'::uuid,
    'World Wildlife Fund',
    'International non-governmental organization working on issues regarding the conservation, conservation and wildlife research.',
    'https://via.placeholder.com/300x200?text=WWF',
    true,
    true,
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000004'::uuid,
    'UNICEF',
    'United Nations organization providing humanitarian aid and development assistance to children and mothers in developing countries.',
    'https://via.placeholder.com/300x200?text=UNICEF',
    true,
    true,
    NOW(),
    NOW()
  )
ON CONFLICT DO NOTHING;
