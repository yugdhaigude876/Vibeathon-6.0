export interface LuftMenuItem {
  name: string
  description?: string | null
  price: number
  category: string
  is_available: boolean
}

export const LUFT_MENU_ITEMS: LuftMenuItem[] = [
  // SOUP
  { name: 'Tomato Queso De Crema', description: 'Creamy roasted tomato soup with baked cheese', price: 480, category: 'Soup', is_available: true },
  { name: 'Mushroom Et Truffle', description: 'Creamy mushroom and truffle scented cream soup', price: 490, category: 'Soup', is_available: true },
  { name: 'Grexico De Tortilla', description: 'Avocado and Greek yogurt soup topped with feta crumble, olive oil, tomato and tortilla', price: 480, category: 'Soup', is_available: true },
  { name: 'Span"Chow', description: 'Spicy chicken or veg soup with garlic, onions, scallions topped with chips', price: 480, category: 'Soup', is_available: true },

  // SALADS
  { name: 'Frozen Tomato Margherita Burrata', description: 'Burrata with lettuce, cucumber, peppers, lemon vinaigrette and tomato snow', price: 530, category: 'Salads', is_available: true },
  { name: 'Laventina Horiatiki', description: 'Classic Greek Fattoush and tabouleh layered with crunchy pita, hummus and feta', price: 520, category: 'Salads', is_available: true },
  { name: 'Southwestern Quinoa Salad', description: 'Quinoa, charred corn and avocado salad with chili lime and cumin yoghurt dressing, cheese', price: 490, category: 'Salads', is_available: true },

  // CHIP N DIP
  { name: 'Nachos Grande', description: 'Nachos with sour cream, refried beans, queso, jalapenos', price: 510, category: 'Chip N Dip', is_available: true },
  { name: 'Veg Con Carne', description: 'Veg con carne with refried beans, queso and jalapenos', price: 540, category: 'Chip N Dip', is_available: true },
  { name: 'Chili Con Carne Chicken', description: 'Chili con carne chicken served with crispy chips', price: 540, category: 'Chip N Dip', is_available: true },
  { name: 'Salted Fries', description: 'Classic salted french fries', price: 410, category: 'Chip N Dip', is_available: true },
  { name: 'Fajita Fries', description: 'French fries tossed in fajita spice blend', price: 410, category: 'Chip N Dip', is_available: true },
  { name: 'Truffle And Sea Salt Fries', description: 'Fries drizzled with truffle oil and sea salt', price: 430, category: 'Chip N Dip', is_available: true },

  // SIGNATURE TAPAS
  { name: 'Patata Bravas', description: 'Crispy potatoes served with spicy sauce and tomatoes', price: 490, category: 'Signature Tapas', is_available: true },
  { name: 'Cottage Cheese Fajita Springrolls', description: 'Grilled bell peppers and cottage cheese with fajita spices', price: 530, category: 'Signature Tapas', is_available: true },
  { name: 'Chicken Fajita Springrolls', description: 'Grilled chicken and peppers rolled in spring rolls and crisp fried', price: 570, category: 'Signature Tapas', is_available: true },
  { name: 'Baked Keftades', description: 'Lamb meat balls baked with tomatoes, spices and cheese', price: 660, category: 'Signature Tapas', is_available: true },
  { name: 'Frito Misto', description: 'Crisp fried seafood, mushroom & vegetables served with tartare sauce', price: 720, category: 'Signature Tapas', is_available: true },
  { name: 'Butter Baked Jacket Potatoes (Corn & Chili)', description: 'Baked jacket potatoes topped with corn and chili', price: 490, category: 'Signature Tapas', is_available: true },
  { name: 'Butter Baked Jacket Potatoes (Chicken Mince)', description: 'Baked jacket potatoes topped with chicken mince and pepper', price: 510, category: 'Signature Tapas', is_available: true },

  // TACOS AND TOSTADAS
  { name: 'Loaded Avocado Taco/Tostada', description: 'Crispy fried avocado, edamame, wasabi cream, crispy spinach, Pico de Gallo', price: 460, category: 'Tacos & Tostadas', is_available: true },
  { name: 'Mock Meat And Spinach Taco/Tostada', description: 'Pepper, mock meat, creamy spinach, tostados, Pico de Gallo, avocados', price: 460, category: 'Tacos & Tostadas', is_available: true },
  { name: 'Chicken Barba"Cola" Taco/Tostada', description: 'Spices, cola braised chicken, mozzarella, Pico de Gallo, salsa', price: 520, category: 'Tacos & Tostadas', is_available: true },
  { name: 'Butter Chicken Taco/Tostada', description: 'Avocado Cremieux, butter chicken best with crispy tostadas', price: 520, category: 'Tacos & Tostadas', is_available: true },
  { name: 'Crispy Seafood Taco/Tostada', description: 'Prawns, fish, squid, corn meal, salsa Verde, lime, sliced onions, lettuce', price: 690, category: 'Tacos & Tostadas', is_available: true },

  // ASIAN TAPAS
  { name: 'Crispy Thai Wok Tossed Mushroom', description: 'Crispy mushroom, fragrant crispy chili, makroot lime leaf, birds eye chili and basil', price: 480, category: 'Asian Tapas', is_available: true },
  { name: 'Crispy Chili Miso Paneer', description: 'Cottage cheese tossed with a reduction of miso & sichuan brown butter', price: 490, category: 'Asian Tapas', is_available: true },
  { name: 'Crispy Chili Miso Seitan', description: 'Home made seitan tossed with a reduction of miso & Sichuan brown butter', price: 480, category: 'Asian Tapas', is_available: true },
  { name: 'Crispy Chili Miso Chicken', description: 'Chicken tossed with a reduction of miso & sichuan brown butter', price: 490, category: 'Asian Tapas', is_available: true },
  { name: 'Bangkok Fried Fish', description: 'Crisp fried fish fingers tossed with makroot lime leaves, bird eye chili and peanuts', price: 670, category: 'Asian Tapas', is_available: true },
  { name: 'Chicken & Leeks with Black Bean - Bourbon', description: 'Chicken tossed with crisp and wilted leeks and beans and bourbon', price: 510, category: 'Asian Tapas', is_available: true },

  // DIMSUM
  { name: 'Veg Crystal Dimsum', description: 'Steamed veg crystal dimsum with Asian herbs', price: 410, category: 'Dimsum', is_available: true },
  { name: 'Singapore Curried Chicken and Cheese Dumplings', description: 'Dumplings stuffed with Singapore curried chicken and cheese', price: 530, category: 'Dimsum', is_available: true },
  { name: 'Truffle Scented Edamame Dimsum', description: 'Edamame dimsum scented with truffle oil', price: 530, category: 'Dimsum', is_available: true },
  { name: 'Prawn and Chive Dimsum', description: 'Fresh prawn and chive steamed dimsum', price: 570, category: 'Dimsum', is_available: true },

  // SUSHI
  { name: 'Tempura Asparagus Uramaki Sushi', description: 'Japanese batter fried asparagus, avocado, blue rice, plum mayonnaise, tanuki', price: 480, category: 'Sushi', is_available: true },
  { name: 'Spicy Shiitake and Avocado Uramaki', description: 'Chili spiced shiitake, togarashi, avocado, scallions', price: 480, category: 'Sushi', is_available: true },
  { name: 'Spicy Salmon Maki', description: 'Salmon, tobanjan, cream cheese, tanuki, plum mayonnaise, scallion, tobiko caviar', price: 620, category: 'Sushi', is_available: true },
  { name: 'Cali Kani-Salad Maki Roll', description: 'Tobanjan Chili, crab stick, avocado, sesame, cream cheese, blue rice', price: 530, category: 'Sushi', is_available: true },
  { name: 'Prawn Tempura Maki', description: 'Crispy prawns, spicy plum aioli, avocado, tanuki, ponzu glaze, blue rice', price: 580, category: 'Sushi', is_available: true },

  // PINCHOS
  { name: 'Roasted Pepper and Cheese Pinchos', description: 'Creamed cheese, herbs and roasted peppers on tapas styled bruschetta', price: 410, category: 'Pinchos', is_available: true },
  { name: 'Mushroom And Truffle Pinchos', description: 'Cheese, herb stuffed mushrooms with chili aioli on tapas styled bruschetta', price: 440, category: 'Pinchos', is_available: true },
  { name: 'Sweet Chili Chicken Pinchos', description: 'Habanero, honey glazed chicken, cheddar cheese, dusted with herb mix', price: 480, category: 'Pinchos', is_available: true },
  { name: 'Basil Butter Avocado Shrimp Pinchos', description: 'Basil butter toast topped with charred avocado and spicy shrimp', price: 570, category: 'Pinchos', is_available: true },

  // INDIAN TAPAS
  { name: 'Gun Powder Mushroom', description: 'South Indian "moluga podi" dusted crisp fried mushroom', price: 490, category: 'Indian Tapas', is_available: true },
  { name: 'Chettinad Paneer Empanadas', description: 'Baked flaky pastry filled with coconut and peppery paneer', price: 470, category: 'Indian Tapas', is_available: true },
  { name: 'Gunpowder Chicken', description: 'South Indian "moluga podi" dusted crisp fried chicken', price: 530, category: 'Indian Tapas', is_available: true },
  { name: 'Chettinad Chicken Empanadas', description: 'Coconut and peppery chicken stuffed in baked flaky pastry', price: 550, category: 'Indian Tapas', is_available: true },

  // CHARCOAL PLATES
  { name: 'Truffle Parmesan Dhingri Tikka', description: 'Truffle oil and cheese stuffed mushrooms, marinated with curd and spices', price: 530, category: 'Charcoal Plates', is_available: true },
  { name: 'Tandoori Shakarkandi Chaat', description: 'Charcoal roasted sweet potatoes topped with sweet and spicy chutney and chaat crisps', price: 490, category: 'Charcoal Plates', is_available: true },
  { name: 'Sweet Potato Chickpea Chaaps', description: 'Sweet potato and chickpeas marinated with spices, pounded and grilled', price: 480, category: 'Charcoal Plates', is_available: true },
  { name: 'Avocado Edamame, Cream Cheese Galauti', description: 'Avocado and edamame smoked with spices and stuffed with cream cheese and nuts, pan seared', price: 620, category: 'Charcoal Plates', is_available: true },
  { name: 'Tuscan Chicken Roulade Tikka', description: 'Mushroom, cheese and spinach rolled into chicken breast and roasted in the tandoor', price: 580, category: 'Charcoal Plates', is_available: true },
  { name: 'TURKISH 1 FEET KEBAB', description: 'Minced lamb and bell peppers seekh served over naan and pickled veg, sumac, thoum', price: 730, category: 'Charcoal Plates', is_available: true },
  { name: 'Fajita Fish Tikka', description: 'Chili spice marinated fish topped with bellpeppers and cheese', price: 720, category: 'Charcoal Plates', is_available: true },

  // PIZZAZ PIZZA
  { name: 'Corn And Veg Carne Pizza', description: 'Charred corn, mock meat, pickled chili, onions, mozzarella, cheddar', price: 580, category: 'Pizzaz Pizza', is_available: true },
  { name: 'Chili Con Carne Pizza', description: 'Spanish minced meat, corn, peppers, pickled chili, onions, mozzarella, cheddar', price: 640, category: 'Pizzaz Pizza', is_available: true },
  { name: 'Birria Pizza', description: 'Slow cooked lamb, onions, cilantro, mozzarella, cheddar', price: 750, category: 'Pizzaz Pizza', is_available: true },
  { name: 'Margherita Pizza', description: 'San Marzano sauce, mozzarella, sundried tomato, cherry tomato, basil', price: 570, category: 'Pizzaz Pizza', is_available: true },
  { name: 'Verdura Paneer Tikka Pizza', description: 'Pesto, mozzarella, wilted spinach, pine nuts, asparagus, tomatoes, caramelized onions and paneer tikka', price: 620, category: 'Pizzaz Pizza', is_available: true },
  { name: 'Garden Primavera Pizza', description: 'San Marzano sauce, mozzarella, caramelized onion, charred corn, zucchini, bell peppers, parmesan', price: 620, category: 'Pizzaz Pizza', is_available: true },
  { name: 'Italian Mob Pizza', description: 'San Marzano sauce, mozzarella, Meat balls, smoked chicken, chicken mince', price: 740, category: 'Pizzaz Pizza', is_available: true },
  { name: 'Pepperoni Pizza', description: 'San Marzano sauce, pepperoni, mozzarella, cheddar', price: 730, category: 'Pizzaz Pizza', is_available: true },

  // GRANDE PLATES
  { name: 'Baked Penne Indienne Rossa', description: 'Creamy tomato pasta with herb baked crust', price: 640, category: 'Grande Plates', is_available: true },
  { name: 'Penne Alla Vodka', description: 'Penne pasta tossed in vodka glazed creamy tomato sauce', price: 670, category: 'Grande Plates', is_available: true },
  { name: 'Penne Pesto', description: 'Choice of plain or creamy pesto with pasta', price: 670, category: 'Grande Plates', is_available: true },
  { name: 'Truffle Cacio E Pepe', description: 'Classic cheese and pepper pasta with truffle oil', price: 690, category: 'Grande Plates', is_available: true },
  { name: 'Smoked Chicken, Mushroom Alfredo', description: 'Smoked chicken and mushroom in creamy cheese sauce', price: 690, category: 'Grande Plates', is_available: true },
  { name: 'Korean Baked Mac and Cheese', description: 'Classic mac and cheese with chili jam and Korean gochujang', price: 690, category: 'Grande Plates', is_available: true },
  { name: 'Birria Lamb Merlot Fettuccini', description: 'Slow cooked lamb deglazed with merlot wine and tossed with fettuccini', price: 760, category: 'Grande Plates', is_available: true },

  // BURRITO BOWLS
  { name: 'Chettinad Portobello Bowl', description: 'Mushroom, Fries, Pilaf Rice, and Pico De Gallo', price: 570, category: 'Burrito Bowls', is_available: true },
  { name: 'Cottage Cheese Steak Bowl', description: 'Vegan mince, corn and peppers topped over rice with guacamole, beans, salsa', price: 690, category: 'Burrito Bowls', is_available: true },
  { name: 'Meat Loaded Burrito', description: 'Meatballs and minced chicken rolled in with fries, beans, salsa', price: 620, category: 'Burrito Bowls', is_available: true },
  { name: 'Grilled Chicken with Chimichurri Bowl', description: 'Chicken marinated with habanero peppers, served with herby sauce and pepper rice', price: 690, category: 'Burrito Bowls', is_available: true },

  // PAELLA & RISOTTO
  { name: 'Paella El Dorada', description: 'Spanish Arborio rice cooked with saffron, almond, vegetables and four cheese', price: 710, category: 'Paella & Risotto', is_available: true },
  { name: 'Paella Vallenciana', description: 'Chicken cooked with arborio rice with tomatoes and house spices', price: 730, category: 'Paella & Risotto', is_available: true },
  { name: 'Rissotto Verdura', description: 'Risotto cooked with edamame, green peas, asparagus, spinach', price: 690, category: 'Paella & Risotto', is_available: true },
  { name: 'Rissotto Al Fungi', description: 'Wild mushrooms and confit garlic cooked with cream and arborio rice topped with parmesan foam', price: 690, category: 'Paella & Risotto', is_available: true },

  // ASIAN BOWLS & BIRYANI
  { name: 'Nasi Goreng', description: 'Indonesian preparation of fried rice topped with saute and optional fried egg and prawn cracker', price: 690, category: 'Asian Bowls', is_available: true },
  { name: 'Thai Red Curry', description: 'House made pounded thai bird eye chilli and herb curry', price: 610, category: 'Asian Bowls', is_available: true },
  { name: 'Thai Green Curry', description: 'House made pounded thai herbs, green chilies curry', price: 610, category: 'Asian Bowls', is_available: true },
  { name: 'Tom Yum Pot Rice/Noodles', description: 'Hot and sour thai birds eye chili sauce and rice', price: 690, category: 'Asian Bowls', is_available: true },
  { name: 'Awadhi Biryani (Veg/Malai Tikka)', description: 'Subtle and fragrant vegetable or chicken cooked with basmati rice', price: 610, category: 'Biryani', is_available: true },
  { name: 'Thelecheri Biryani (Paneer Tikka/Prawn)', description: 'Syrian catholic influenced biryani from Kerala', price: 680, category: 'Biryani', is_available: true },

  // MAINS
  { name: '3 Cheese Steak', description: 'Cottage cheese sandwiched with sicilia Pesto and mozzarella served with saute vegetables and corn mash', price: 680, category: 'Mains', is_available: true },
  { name: 'Pollo La Plancha', description: 'Chicken marinated with chili citrus mojo marinade served with charred potatoes and vegetables', price: 710, category: 'Mains', is_available: true },
  { name: 'Horno De Maricos', description: 'Grilled fish with sauteed vegetables, potato corn mash and romesco sauce', price: 790, category: 'Mains', is_available: true },
  { name: 'Chicken Roulade Chops', description: 'Chicken roulade with pepperjack cheese served with corn mash and pepper sauce', price: 730, category: 'Mains', is_available: true },
  { name: 'Luft Dal Makhani', description: 'Black dal cooked with tomatoes, Kasuri methi and butter. Served with lacha paratha or cilantro jeera rice', price: 610, category: 'Mains', is_available: true },
  { name: 'Burrata Saag', description: 'Garlic and white butter, spinach gravy topped with fresh burrata, masala bondi and garlic chips. Served with missi roti or ghee bhat', price: 690, category: 'Mains', is_available: true },
  { name: 'Shahi Edamame Kofta', description: 'Cottage cheese and edamame koftas in Awadhi gravy. Served with kulcha or pilaf', price: 690, category: 'Mains', is_available: true },
  { name: 'Chicken Chaap Saagwale', description: 'Chicken chaap roulade with peppers and cheese with garlic flavoured spinach gravy. Served with missi roti or ghee bhat', price: 710, category: 'Mains', is_available: true },
  { name: 'Grilled Chicken, Padhra Rassa', description: 'Grilled chicken leg with sesame and spices, served with roti or steamed rice', price: 730, category: 'Mains', is_available: true },
  { name: 'Brit Mean Moilee, Sambal Rice', description: 'British curried fish cakes topped with Kerala style coconut fish curry and caviar, served with chili rice', price: 780, category: 'Mains', is_available: true },
  { name: 'Kashmiri Mirch Malai Prawns', description: 'Plump prawns braised with cream, yogurt, fragrant spices and Kashmiri chili. Served with garlic naan or pilaf', price: 780, category: 'Mains', is_available: true },

  // SIDES & DESSERT
  { name: 'Roti / Butter Roti', description: 'Traditional Indian flatbread', price: 90, category: 'Sides', is_available: true },
  { name: 'Naan / Butter Naan', description: 'Soft oven baked flatbread', price: 130, category: 'Sides', is_available: true },
  { name: 'Cheese Garlic Naan', description: 'Oven baked flatbread stuffed with cheese and garlic', price: 170, category: 'Sides', is_available: true },
  { name: 'Steamed Rice', description: 'Fluffy steamed basmati rice', price: 310, category: 'Sides', is_available: true },
  { name: 'Butter Corn', description: 'Sweet corn tossed in melted butter and herbs', price: 280, category: 'Sides', is_available: true },
  { name: 'Corn and Potato Mash', description: 'Creamy mashed potato and corn', price: 280, category: 'Sides', is_available: true },
  { name: 'Taffioli Banoffee', description: 'Caramelized and fresh banana, dulce stuffed crisp pastry', price: 510, category: 'Dessert', is_available: true },
  { name: 'Churros Palate', description: 'Warm churros with dark chocolate, salted caramel, strawberry ganache', price: 530, category: 'Dessert', is_available: true },
  { name: 'Avocado Ice Cream with Avocado Salsa', description: 'Creamy avocado ice cream paired with fresh avocado salsa', price: 260, category: 'Dessert', is_available: true },
  { name: 'Mango Passion Fruit Sorbet', description: 'Refreshing tropical mango and passion fruit sorbet', price: 240, category: 'Dessert', is_available: true },
]
