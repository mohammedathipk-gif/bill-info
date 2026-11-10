// QuickBite sample catalog and shared constants.
const DEFAULT_CATEGORIES = [
  { id: 'all', name: 'All Items', icon: 'utensils' },
  { id: 'burgers', name: 'Burgers & Wraps', icon: 'sandwich' },
  { id: 'pizza', name: 'Artisan Pizzas', icon: 'pizza' },
  { id: 'biryani', name: 'Biryani & Rice', icon: 'cooking-pot' },
  { id: 'starters', name: 'Starters & Grills', icon: 'flame' },
  { id: 'drinks', name: 'Drinks & Shakes', icon: 'cup-soda' },
  { id: 'desserts', name: 'Desserts & Bakes', icon: 'cake' }
];

const DEFAULT_TABLES = [
  ...Array.from({ length: 8 }, (_, index) => `Dine-In Table ${index + 1}`),
  'Takeaway',
  'Delivery'
];

const DEFAULT_MENU_ITEMS = [
  { id: 'qb-burger', name: 'Classic Veg Burger', price: 129, category: 'burgers', veg: true, description: 'Crispy patty, lettuce and house sauce.', tag: 'Bestseller', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80', inStock: true },
  { id: 'qb-chicken-burger', name: 'Crispy Chicken Burger', price: 179, category: 'burgers', veg: false, description: 'Golden chicken, fresh lettuce and creamy sauce.', tag: 'Popular', image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=500&auto=format&fit=crop&q=80', inStock: true },
  { id: 'qb-paneer-wrap', name: 'Paneer Tikka Wrap', price: 159, category: 'burgers', veg: true, description: 'Smoky paneer and crunchy vegetables.', tag: '', image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80', inStock: true },
  { id: 'qb-margherita', name: 'Margherita Pizza', price: 249, category: 'pizza', veg: true, description: 'Mozzarella, basil and rich tomato sauce.', tag: 'Chef Special', image: 'https://images.unsplash.com/photo-1579751626657-72bc17010498?w=500&auto=format&fit=crop&q=80', inStock: true },
  { id: 'qb-farmhouse', name: 'Farmhouse Pizza', price: 329, category: 'pizza', veg: true, description: 'Loaded with peppers, onion, corn and olives.', tag: '', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80', inStock: true },
  { id: 'qb-veg-biryani', name: 'Veg Dum Biryani', price: 199, category: 'biryani', veg: true, description: 'Fragrant basmati rice with aromatic spices.', tag: 'Popular', image: 'https://images.unsplash.com/photo-1563379091339-03246963d96c?w=500&auto=format&fit=crop&q=80', inStock: true },
  { id: 'qb-chicken-biryani', name: 'Chicken Biryani', price: 269, category: 'biryani', veg: false, description: 'Dum-cooked chicken biryani served with raita.', tag: 'Bestseller', image: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=500&auto=format&fit=crop&q=80', inStock: true },
  { id: 'qb-fries', name: 'Peri Peri Fries', price: 99, category: 'starters', veg: true, description: 'Crispy fries tossed with peri peri seasoning.', tag: '', image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=80', inStock: true },
  { id: 'qb-wings', name: 'Grilled Chicken Wings', price: 219, category: 'starters', veg: false, description: 'Smoky grilled wings with a spicy glaze.', tag: 'Spicy 🔥', image: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=500&auto=format&fit=crop&q=80', inStock: true },
  { id: 'qb-lemonade', name: 'Fresh Lime Soda', price: 69, category: 'drinks', veg: true, description: 'Fresh lime, soda and a touch of mint.', tag: '', image: 'https://images.unsplash.com/photo-1513558161293-cdab765d3b88?w=500&auto=format&fit=crop&q=80', inStock: true },
  { id: 'qb-milkshake', name: 'Chocolate Milkshake', price: 139, category: 'drinks', veg: true, description: 'Thick chocolate shake topped with cocoa.', tag: '', image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=80', inStock: true },
  { id: 'qb-brownie', name: 'Chocolate Brownie', price: 109, category: 'desserts', veg: true, description: 'Warm, fudgy brownie baked in-house.', tag: 'Sweet Treat', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=80', inStock: true }
];

const DEFAULT_SETTINGS = {
  storeName: 'QuickBite Cafe', tagline: 'Fresh food, happy moments', phone: '', address: '', gstin: '', currency: '₹', taxRate: 5,
  serviceChargeRate: 0, upiId: '', receiptFooter: 'Thank you for your visit!'
};
