require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/userSchema');
const Product = require('./models/productSchema');
const Category = require('./models/categorySchema');
const Setting = require('./models/settingSchema');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const existing = await User.findOne({ role: 'admin' });
  if (existing) {
    console.log('Admin account already exists:', existing.email);
  } else {
    const hashed = await bcrypt.hash('admin123', 10);
    await User.create({ email: 'admin@bytima.com', password: hashed, name: 'Admin By Tima', role: 'admin', permissions: ['products', 'orders', 'customers', 'settings', 'users'] });
    console.log('Admin account created: admin@bytima.com / admin123');
  }

  const categoryCount = await Category.countDocuments();
  if (categoryCount === 0) {
    await Category.create([
      { name: 'مواد العناية بالبشرة', slug: 'skincare', description: 'كريمات ومرطبات ومنتجات العناية بالبشرة', order: 1 },
      { name: 'مواد العناية بالجسم', slug: 'body-care', description: 'صابون ومرطبات ومنتجات العناية بالجسم', order: 2 },
      { name: 'مواد العناية بالشعر', slug: 'hair-care', description: 'زيوت ومنتجات العناية بالشعر', order: 3 }
    ]);
    console.log('Categories created');
  } else {
    console.log('Categories already exist');
  }

  const productCount = await Product.countDocuments();
  if (productCount === 0) {
    await Product.create([
      {
        name: 'كريم مرطب طبيعي',
        price: 35,
        oldPrice: 45,
        compareAtPrice: 45,
        category: 'مواد العناية بالبشرة',
        tags: ['مرطب', 'كريم', 'شيا', 'بشرة'],
        description: 'كريم مرطب طبيعي بزبدة الشيا للعناية بالبشرة',
        ingredients: 'زبدة شيا، زيت جوز الهند، فيتامين E',
        usage: 'يوضع على البشرة النظيفة صباحاً ومساءً',
        weight: '50ml',
        unit: 'ml',
        quantity: 30,
        lowStockAlert: 5,
        inStock: true,
        featured: true,
        image: '/img/no-image.svg'
      },
      {
        name: 'تونر طبيعي للوجه',
        price: 28,
        oldPrice: 0,
        compareAtPrice: 0,
        category: 'مواد العناية بالبشرة',
        tags: ['تونر', 'وجه', 'بشرة', 'ماء ورد'],
        description: 'تونر طبيعي بماء الورد لتنقية البشرة',
        ingredients: 'ماء ورد طبيعي، خلاصة الخيار',
        usage: 'يستخدم بعد غسل الوجه صباحاً ومساءً',
        weight: '100ml',
        unit: 'ml',
        quantity: 40,
        lowStockAlert: 10,
        inStock: true,
        featured: false,
        image: '/img/no-image.svg'
      },
      {
        name: 'صابون الغار الحلبي',
        price: 25,
        oldPrice: 0,
        compareAtPrice: 0,
        category: 'مواد العناية بالجسم',
        tags: ['صابون', 'غار', 'حلبي', 'جسم'],
        description: 'صابون غار حلبي تقليدي طبيعي للجسم',
        ingredients: 'زيت زيتون، زيت الغار',
        usage: 'يستخدم للوجه والجسم',
        weight: '200g',
        unit: 'g',
        quantity: 100,
        lowStockAlert: 20,
        inStock: true,
        featured: true,
        image: '/img/no-image.svg'
      },
      {
        name: 'كريم مرطب للجسم',
        price: 30,
        oldPrice: 40,
        compareAtPrice: 40,
        category: 'مواد العناية بالجسم',
        tags: ['كريم', 'جسم', 'مرطب', 'لوشن'],
        description: 'كريم مرطب للجسم بزبدة الشيا وجوز الهند',
        ingredients: 'زبدة شيا، زيت جوز الهند، فيتامين E',
        usage: 'يدلك على الجسم بعد الاستحمام',
        weight: '150ml',
        unit: 'ml',
        quantity: 25,
        lowStockAlert: 5,
        inStock: true,
        featured: false,
        image: '/img/no-image.svg'
      },
      {
        name: 'زيت الأركان النقي',
        price: 45,
        oldPrice: 60,
        compareAtPrice: 60,
        category: 'مواد العناية بالشعر',
        tags: ['أركان', 'زيت', 'شعر', 'ترطيب'],
        description: 'زيت أركان نقي ١٠٠٪ للعناية بالشعر',
        ingredients: 'زيت الأركان العضوي النقي',
        usage: 'يدلك على فروة الرأس وأطراف الشعر',
        weight: '100ml',
        unit: 'ml',
        quantity: 50,
        lowStockAlert: 10,
        inStock: true,
        featured: true,
        image: '/img/no-image.svg'
      },
      {
        name: 'زيت جوز الهند للشعر',
        price: 35,
        oldPrice: 0,
        compareAtPrice: 0,
        category: 'مواد العناية بالشعر',
        tags: ['جوز الهند', 'زيت', 'شعر', 'ترطيب'],
        description: 'زيت جوز الهند البكر لتغذية وترطيب الشعر',
        ingredients: 'زيت جوز الهند البكر العضوي',
        usage: 'يدلك على الشعر ويترك لمدة ٣٠ دقيقة ثم يغسل',
        weight: '200ml',
        unit: 'ml',
        quantity: 35,
        lowStockAlert: 10,
        inStock: true,
        featured: false,
        image: '/img/no-image.svg'
      }
    ]);
    console.log('Sample products created');
  } else {
    console.log('Products already exist, skipping seed');
  }

  const whatsappPhone = await Setting.get('whatsappPhone');
  if (!whatsappPhone) {
    await Setting.set('whatsappPhone', '963934034810');
    console.log('WhatsApp phone set');
  }

  const shamCashName = await Setting.get('shamCashName');
  if (!shamCashName) {
    await Setting.set('shamCashName', 'BY TIMA');
  }
  const shamCashPhone = await Setting.get('shamCashPhone');
  if (!shamCashPhone) {
    await Setting.set('shamCashPhone', '0934034810');
  }

  await mongoose.disconnect();
  console.log('Seed complete');
}

seed().catch(err => { console.error(err); process.exit(1); });
