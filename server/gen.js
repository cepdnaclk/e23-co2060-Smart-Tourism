const fs = require('fs');
const content = fs.readFileSync('src/database/seedData.js', 'utf8');
const match = content.match(/const samplePlaces = (\[[\s\S]*?\]);/);
const samplePlaces = eval(match[1]);

let sql = '-- Paste this entire script into your Supabase SQL Editor\n\n';
sql += 'INSERT INTO places (name, description, latitude, longitude, category, image_url) VALUES\n';

const values = samplePlaces.map(p => {
    return '(' + [p.name, p.description, p.latitude, p.longitude, p.category, p.image_url].map(v => {
        if (typeof v === 'string') {
            return \"'\" + v.replace(/'/g, \"''\") + \"'\";
        }
        return v;
    }).join(', ') + ')';
}).join(',\n');

sql += values + '\nON CONFLICT (name) DO NOTHING;\n';

fs.writeFileSync('seed_places.sql', sql);
