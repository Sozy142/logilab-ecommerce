const { faker } = require('@faker-js/faker');
const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5433,
  user: 'logilab',
  password: 'logilab_dev_password', // Password trong docker-compose.dev.yml
  database: 'logilab'
});


const hardwareBrands = ['Espressif', 'Raspberry Pi', 'NVIDIA', 'STMicroelectronics', 'Sensirion', 'Seeed Studio'];

async function run() {
  await client.connect();
  console.log('🔌 Connected to Logilab DB');

  try {
    const catRes = await client.query(`
      INSERT INTO categories (name, slug) 
      VALUES ('AIoT & Hardware', 'aiot-hardware')
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING id;
    `);
    const categoryId = catRes.rows[0].id;

    console.log('🎲 Generating 20 fake hardware products...');

    for (let i = 0; i < 20; i++) {
      const brand = faker.helpers.arrayElement(hardwareBrands);
      const name = `${brand} ${faker.commerce.productAdjective()} Module v${faker.number.int({ min: 1, max: 5 })}`;
      const slug = `${faker.helpers.slugify(name).toLowerCase()}-${faker.string.alphanumeric(4)}`;
      const price = parseFloat(faker.commerce.price({ min: 5, max: 299 }));
      const description = faker.commerce.productDescription();
      const imageUrl = `https://picsum.photos/seed/${slug}/600/400`;

      const pRes = await client.query(`
        INSERT INTO products (name, slug, description, category_id, brand)
        VALUES ($1, $2, $3, $4, $5) RETURNING id;
      `, [name, slug, description, categoryId, brand]);

      const productId = pRes.rows[0].id;

      await client.query(`
        INSERT INTO product_variants (product_id, variant_name, price, stock)
        VALUES ($1, 'Standard Edition', $2, $3);
      `, [productId, price, faker.number.int({ min: 10, max: 200 })]);

      await client.query(`
        INSERT INTO product_images (product_id, image_url, display_order)
        VALUES ($1, $2, 0);
      `, [productId, imageUrl]);
    }

    console.log('✅ Generated 20 products successfully!');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

run();
