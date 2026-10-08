-- ============================================================================
-- Seed Data: 5 Restaurants for Testing & Demo
-- Run after migration. All prices in MXN.
-- ============================================================================

-- ============================================================================
-- 1. DI PASQUALE — Italian Restaurant (Morelos 908, Barrio Antiguo)
-- ============================================================================
INSERT INTO restaurants (id, name, slug, description, address, phone, cuisine_type, mode, currency, primary_color, secondary_color, accent_color) VALUES
('r_dipasquale', 'Di Pasquale', 'di-pasquale', 'Auténtica cocina italiana desde 1992. Pizzas artesanales, pastas frescas y antipasti en el corazón de Barrio Antiguo.', 'Calle Morelos 908 Ote, Barrio Antiguo, Centro, 64000 Monterrey', '8180000001', 'Italiana', 'dine-in', 'MXN', '#8B1A1A', '#C41E3A', '#D4AF37');

INSERT INTO restaurant_owners (restaurant_id, name, phone, email) VALUES ('r_dipasquale', 'Pasquale Vallone', '8180000001', 'pasquale@dipasquale.mx');

-- Antipasti
INSERT INTO menu_items (restaurant_id, category, name, description, price, station, sort_order) VALUES
('r_dipasquale', 'Antipasti', 'Bruschetta Toscana', 'Tostín gratinado con queso mozzarella, tomate y especias', 95, 'kitchen', 1),
('r_dipasquale', 'Antipasti', 'Portobello', 'Hongo portobello asado a las finas hierbas y gratinado con queso mozzarella', 120, 'kitchen', 2),
('r_dipasquale', 'Antipasti', 'Carpaccio de Res', 'Finas láminas de res acompañadas de arúgula y queso parmesano', 155, 'kitchen', 3),
('r_dipasquale', 'Antipasti', 'Crema de Tomate', 'Crema suave de tomate con albahaca fresca', 85, 'kitchen', 4);

-- Ensaladas
INSERT INTO menu_items (restaurant_id, category, name, description, price, station, sort_order) VALUES
('r_dipasquale', 'Ensaladas', 'Ensalada César', 'Lechuga romana, crutones, queso parmesano y aderezo César', 140, 'kitchen', 5),
('r_dipasquale', 'Ensaladas', 'Ensalada Mediterránea', 'Mezcla de lechugas con queso mozzarella y carnes frías, aderezo de finas hierbas', 135, 'kitchen', 6),
('r_dipasquale', 'Ensaladas', 'Ensalada Caprese', 'Queso mozzarella fresco, tomate, albahaca y pesto', 130, 'kitchen', 7);

-- Pastas
INSERT INTO menu_items (restaurant_id, category, name, description, price, station, sort_order) VALUES
('r_dipasquale', 'Pastas', 'Lasagna', 'Láminas de pasta con salsa bolognesa, bechamel, mozzarella y parmesano gratinado', 185, 'kitchen', 8),
('r_dipasquale', 'Pastas', 'Pasta Carbonara', 'Yema, pancetta (tocino italiano) y queso parmesano', 165, 'kitchen', 9),
('r_dipasquale', 'Pastas', 'Pasta Alfredo con Champiñón', 'Salsa de crema con queso parmesano y champiñón', 140, 'kitchen', 10),
('r_dipasquale', 'Pastas', 'Pasta Pomodoro', 'Salsa tradicional de tomate con albahaca fresca', 130, 'kitchen', 11),
('r_dipasquale', 'Pastas', 'Pasta Pesto Verde', 'Albahaca fresca, piñones, aceite de oliva y queso parmesano', 150, 'kitchen', 12),
('r_dipasquale', 'Pastas', 'Pasta Arrabiata', 'Salsa de tomate picante con chile de árbol', 140, 'kitchen', 13),
('r_dipasquale', 'Pastas', 'Pasta 4 Quesos', 'Mozzarella, gorgonzola, emmental y gouda en salsa cremosa', 160, 'kitchen', 14),
('r_dipasquale', 'Pastas', 'Linguini Gamberi', 'Linguini al pesto con camarón (200g)', 195, 'kitchen', 15),
('r_dipasquale', 'Pastas', 'Espagueti Frutti di Mare', 'Mezcla de mariscos con salsa pomodoro', 210, 'kitchen', 16);

-- Pizzas (individual 30cm)
INSERT INTO menu_items (restaurant_id, category, name, description, price, station, sort_order) VALUES
('r_dipasquale', 'Pizzas', 'Regina Margherita', 'Mozzarella, albahaca y aceite de oliva extra virgen', 145, 'kitchen', 17),
('r_dipasquale', 'Pizzas', 'Pepperoni', 'Pepperoni, champiñones y mozzarella', 145, 'kitchen', 18),
('r_dipasquale', 'Pizzas', '4 Formaggi', 'Mozzarella, emmental, gorgonzola y gouda con salsa alfredo', 195, 'kitchen', 19),
('r_dipasquale', 'Pizzas', 'Saporita', 'Base 4 quesos, tomates horneados y jamón serrano', 240, 'kitchen', 20),
('r_dipasquale', 'Pizzas', 'Toscana', 'Mozzarella, jamón serrano, arúgula, parmesano y salami', 235, 'kitchen', 21),
('r_dipasquale', 'Pizzas', 'Contessa', 'Jamón serrano, queso de cabra, mozzarella y espinacas baby', 195, 'kitchen', 22),
('r_dipasquale', 'Pizzas', 'Mari e Monti', 'Camarones, champiñones, hojuelas de chile y mozzarella', 205, 'kitchen', 23),
('r_dipasquale', 'Pizzas', 'Hawaii', 'Jamón de pavo, piña y tocino', 135, 'kitchen', 24),
('r_dipasquale', 'Pizzas', 'Americana Hot', 'Doble mozzarella picante, pepperoni y hojuelas de chile', 160, 'kitchen', 25);

-- Especiales
INSERT INTO menu_items (restaurant_id, category, name, description, price, station, sort_order) VALUES
('r_dipasquale', 'Especiales', 'Huachinango al Limoncello', 'Huachinango montado sobre pasta blanca cremosa', 240, 'kitchen', 26),
('r_dipasquale', 'Especiales', 'Salmón Siciliano', '220g de salmón acompañado con vegetales salteados', 260, 'kitchen', 27),
('r_dipasquale', 'Especiales', 'Rib Eye a las Finas Hierbas', '300g de rib eye con papitas al romero', 320, 'kitchen', 28),
('r_dipasquale', 'Especiales', 'Pechuga de Pollo al Grill', '220g de pechuga con vegetales y papitas al romero', 195, 'kitchen', 29);

-- Postres
INSERT INTO menu_items (restaurant_id, category, name, description, price, station, sort_order) VALUES
('r_dipasquale', 'Postres', 'Tiramisú', 'Clásico postre italiano con mascarpone, café y cacao', 95, 'kitchen', 30),
('r_dipasquale', 'Postres', 'Mousse de Glorias', 'Suave mousse con sabor a glorias', 95, 'kitchen', 31),
('r_dipasquale', 'Postres', 'Brownie con Nieve', 'Brownie de chocolate caliente con nieve de vainilla', 90, 'kitchen', 32);

-- Bebidas
INSERT INTO menu_items (restaurant_id, category, name, description, price, station, sort_order) VALUES
('r_dipasquale', 'Bebidas', 'Café Americano', 'Café americano recién preparado', 48, 'bar', 33),
('r_dipasquale', 'Bebidas', 'Cappuccino', 'Cappuccino italiano espumoso', 50, 'bar', 34),
('r_dipasquale', 'Bebidas', 'Limonada', 'Limonada natural fresca', 35, 'bar', 35),
('r_dipasquale', 'Bebidas', 'Sangría Topo Chico', 'Sangría original o light 600ml', 25, 'bar', 36),
('r_dipasquale', 'Bebidas', 'Coca-Cola', 'Coca-Cola original o light 500ml', 25, 'bar', 37),
('r_dipasquale', 'Bebidas', 'Agua Embotellada', 'Agua purificada 500ml', 20, 'bar', 38);

-- ============================================================================
-- 2. AZÚCAR Y NUEZ — Artisan Desserts (Guadalupe Centro)
-- ============================================================================
INSERT INTO restaurants (id, name, slug, description, address, phone, cuisine_type, mode, currency, primary_color, secondary_color, accent_color) VALUES
('r_azucarynuez', 'Azúcar y Nuez', 'azucar-y-nuez', 'Postres artesanales recién hechos, sin conservadores y con ingredientes de la mejor calidad. Cheesecakes, pays y más.', 'Guadalupe Centro, Monterrey', '8180000002', 'Postres', 'to-go', 'MXN', '#8B4513', '#D2691E', '#F5DEB3');

INSERT INTO restaurant_owners (restaurant_id, name, phone, email) VALUES ('r_azucarynuez', 'María Azúcar', '8180000002', 'hola@azucarynuez.mx');

INSERT INTO menu_items (restaurant_id, category, name, description, price, station, sort_order) VALUES
('r_azucarynuez', 'Cheesecakes', 'Cheesecake Clásico', 'Cheesecake cremoso con base de galleta', 95, 'kitchen', 1),
('r_azucarynuez', 'Cheesecakes', 'Cheesecake de Manzana con Canela', 'Cheesecake con lajitas de manzana, canela y crujientes trocitos de nuez', 110, 'kitchen', 2),
('r_azucarynuez', 'Cheesecakes', 'Cheesecake de Plátano', 'Cheesecake suave con plátano natural y caramelo', 110, 'kitchen', 3),
('r_azucarynuez', 'Cheesecakes', 'Cheesecake Tortuga', 'Cheesecake con caramelo, nuez y chocolate', 120, 'kitchen', 4),
('r_azucarynuez', 'Cheesecakes', 'Cheesecake de Coco', 'Cheesecake con coco rallado y base de galleta', 110, 'kitchen', 5);

INSERT INTO menu_items (restaurant_id, category, name, description, price, station, sort_order) VALUES
('r_azucarynuez', 'Pays', 'Pay de Nuez Clásico', 'Pay de nuez con relleno suave de cajeta y nuez caramelizada', 95, 'kitchen', 6),
('r_azucarynuez', 'Pays', 'Pay de Queso', 'Pay de queso cremoso con cubierta de mermelada', 90, 'kitchen', 7),
('r_azucarynuez', 'Pays', 'Pay de Limón', 'Pay de limón con merengue italiano', 90, 'kitchen', 8);

INSERT INTO menu_items (restaurant_id, category, name, description, price, station, sort_order) VALUES
('r_azucarynuez', 'Postres Individuales', 'Mostachón', 'Clásico mostachón con crema, nuez y merengue', 75, 'kitchen', 9),
('r_azucarynuez', 'Postres Individuales', 'Alfajor', 'Suaves capas rellenas de dulce de leche con azúcar glass', 45, 'kitchen', 10),
('r_azucarynuez', 'Postres Individuales', 'Beso de Ángel', 'Suave suspiro relleno de crema', 40, 'kitchen', 11),
('r_azucarynuez', 'Postres Individuales', 'Flan Napolitano', 'Flan cremoso de vainilla con caramelo', 55, 'kitchen', 12);

INSERT INTO menu_items (restaurant_id, category, name, description, price, station, sort_order) VALUES
('r_azucarynuez', 'Bebidas', 'Café Americano', 'Café de especialidad americano', 35, 'bar', 13),
('r_azucarynuez', 'Bebidas', 'Café de Olla', 'Café de olla con canela y piloncillo', 40, 'bar', 14),
('r_azucarynuez', 'Bebidas', 'Capuccino', 'Capuccino espumoso', 45, 'bar', 15),
('r_azucarynuez', 'Bebidas', 'Chocolate Caliente', 'Chocolate caliente artesanal', 45, 'bar', 16),
('r_azucarynuez', 'Bebidas', 'Limonada Natural', 'Limonada fresca', 30, 'bar', 17);

-- ============================================================================
-- 3. LOS BUCANEROS — Mexican Seafood & Breakfast (Monterrey)
-- ============================================================================
INSERT INTO restaurants (id, name, slug, description, address, phone, cuisine_type, mode, currency, primary_color, secondary_color, accent_color) VALUES
('r_bucaneros', 'Los Bucaneros', 'los-bucaneros', 'Cocina de mar y desayunos tradicionales. Nuestros huevos bucaneros y chilaquiles marineros son famosos en Monterrey.', 'Monterrey Centro', '8180000003', 'Mariscos y Mexicana', 'dine-in', 'MXN', '#1B4965', '#0D1B2A', '#E0A96D');

INSERT INTO restaurant_owners (restaurant_id, name, phone, email) VALUES ('r_bucaneros', 'Capitán Bucanero', '8180000003', 'capitan@bucaneros.mx');

-- Desayunos
INSERT INTO menu_items (restaurant_id, category, name, description, price, station, sort_order) VALUES
('r_bucaneros', 'Desayunos', 'Huevos Bucaneros', 'Dos huevos estrellados sobre cama de camarones bañados en salsa ranchera, con aguacate y frijoles refritos', 185, 'kitchen', 1),
('r_bucaneros', 'Desayunos', 'Huevos Rancheros', 'Huevos con salsa ranchera de la casa, chilaquiles y frijoles refritos', 155, 'kitchen', 2),
('r_bucaneros', 'Desayunos', 'Omelette Tradicional', 'Relleno de jamón y queso bañado en salsa ranchera con chilaquiles', 155, 'kitchen', 3),
('r_bucaneros', 'Desayunos', 'Omelette Portobello', 'Relleno de portobello sazonado con tomates y queso panela, bañado en alioli de chile ancho', 160, 'kitchen', 4),
('r_bucaneros', 'Desayunos', 'Omelette de Claras', 'Claras de 3 huevos rellenas de espinacas, cebolla y champiñones con ensalada caprese', 150, 'kitchen', 5),
('r_bucaneros', 'Desayunos', 'Chilaquiles Verdes/Rojos', 'Chilaquiles con crema, cebolla morada, gratinados con queso y frijoles refritos', 125, 'kitchen', 6),
('r_bucaneros', 'Desayunos', 'Chilaquiles Marineros', 'Bañados en salsa de chile güerito con camarón o pulpo gratinados, aguacate y frijoles', 175, 'kitchen', 7),
('r_bucaneros', 'Desayunos', 'Enchiladas Suizas', 'Tres enchiladas de pollo bañadas con salsa cremosa de chilaca', 165, 'kitchen', 8),
('r_bucaneros', 'Desayunos', 'Enchiladas Bucaneros', 'Tres enchiladas de camarón o marlin a la mexicana con ensalada y frijoles', 175, 'kitchen', 9),
('r_bucaneros', 'Desayunos', 'Machaca de Res', 'Dos huevos revueltos con machaca a la mexicana, chilaquiles y frijoles', 185, 'kitchen', 10),
('r_bucaneros', 'Desayunos', 'Pozole de Camarón', 'Maíz pozolero con camarón fresco y seco, cebolla, lechuga, totopos y salsita roja', 175, 'kitchen', 11),
('r_bucaneros', 'Desayunos', 'Pancakes Bucaneros', 'Tres hot cakes grandes con fresas, kiwi, tocino y buttermilk', 130, 'kitchen', 12),
('r_bucaneros', 'Desayunos', 'Chocowaffles', 'Dos waffles bañados con chocolate, frutos rojos y buttermilk', 115, 'kitchen', 13),
('r_bucaneros', 'Desayunos', 'Panini del Chef', 'Pan chapata con pechuga de pollo a la plancha, espinaca y jocoque, con ensalada caprese', 175, 'kitchen', 14),
('r_bucaneros', 'Desayunos', 'Molletes Mexicanos', 'Con chorizo, queso gratinado y pico de gallo', 130, 'kitchen', 15),
('r_bucaneros', 'Desayunos', 'Plato de Frutas', 'Melón, piña, papaya, kiwi, fresas con miel, granola y queso cottage', 120, 'kitchen', 16);

-- Entradas
INSERT INTO menu_items (restaurant_id, category, name, description, price, station, sort_order) VALUES
('r_bucaneros', 'Entradas', 'Cucurucho de Atún', 'Tres canastitas de maíz rellenas de atún fresco con mango, cacahuate y aguacate', 205, 'kitchen', 17),
('r_bucaneros', 'Entradas', 'Arroz Marinero', 'Arroz frito con vino blanco, almeja, mejillones, camarón y filete de pescado', 205, 'kitchen', 18),
('r_bucaneros', 'Entradas', 'Pulpo Bucaneros', 'Pulpo a las brasas perfumado con ajillo y aceite de olivo', 345, 'kitchen', 19),
('r_bucaneros', 'Entradas', 'Pulpo Zarandeado', 'Pulpo zarandeado con receta especial de la casa terminado en carbón', 345, 'kitchen', 20),
('r_bucaneros', 'Entradas', 'Tacos Gober de Camarón', 'Tacos estilo gober con camarón fresco', 175, 'kitchen', 21);

-- Bebidas desayuno
INSERT INTO menu_items (restaurant_id, category, name, description, price, station, sort_order) VALUES
('r_bucaneros', 'Bebidas', 'Café Americano', 'Café americano', 28, 'bar', 22),
('r_bucaneros', 'Bebidas', 'Cappuccino', 'Cappuccino espumoso', 45, 'bar', 23),
('r_bucaneros', 'Bebidas', 'Expresso', 'Café expresso', 35, 'bar', 24),
('r_bucaneros', 'Bebidas', 'Jugo de Naranja', 'Jugo de naranja fresco', 40, 'bar', 25),
('r_bucaneros', 'Bebidas', 'Juego Verde', 'Espinaca, piña, plátano y miel', 50, 'bar', 26),
('r_bucaneros', 'Bebidas', 'Licuado de Plátano', 'Licuado de plátano con leche', 35, 'bar', 27),
('r_bucaneros', 'Bebidas', 'Licuado de Fresa', 'Licuado de fresa con leche', 45, 'bar', 28),
('r_bucaneros', 'Bebidas', 'Chocolate Caliente', 'Chocolate caliente', 30, 'bar', 29);

-- ============================================================================
-- 4. SENCILLITO CAFÉ — Café & Books (Mina 918, Barrio Antiguo)
-- ============================================================================
INSERT INTO restaurants (id, name, slug, description, address, phone, cuisine_type, mode, currency, primary_color, secondary_color, accent_color) VALUES
('r_sencillito', 'Sencillito Café', 'sencillito-cafe', 'Café de especialidad y libros en el corazón de Barrio Antiguo. Ambiente acogedor con vistas al centro. Waffles, postres y café.', 'Francisco Javier Mina 918, Barrio Antiguo, Centro, 64000 Monterrey', '8180000004', 'Cafetería', 'dine-in', 'MXN', '#2C1810', '#4A2F1A', '#C4956A');

INSERT INTO restaurant_owners (restaurant_id, name, phone, email) VALUES ('r_sencillito', 'Sencillito Café', '8180000004', 'sencillitocafe@gmail.com');

INSERT INTO menu_items (restaurant_id, category, name, description, price, station, sort_order) VALUES
('r_sencillito', 'Café', 'Café Americano', 'Café de especialidad americano', 32, 'bar', 1),
('r_sencillito', 'Café', 'Cappuccino', 'Cappuccino de especialidad', 49, 'bar', 2),
('r_sencillito', 'Café', 'Cappuccino Frío', 'Cappuccino frío de especialidad', 54, 'bar', 3),
('r_sencillito', 'Café', 'Expresso', 'Café expresso', 32, 'bar', 4),
('r_sencillito', 'Café', 'Expresso Cortado', 'Expresso cortado con leche', 32, 'bar', 5),
('r_sencillito', 'Café', 'Macchiato', 'Macchiato de especialidad', 49, 'bar', 6),
('r_sencillito', 'Café', 'Descafeinado', 'Café descafeinado de especialidad', 32, 'bar', 7);

INSERT INTO menu_items (restaurant_id, category, name, description, price, station, sort_order) VALUES
('r_sencillito', 'Tés', 'Té Marrakesh', 'Té verde con menta y especias', 32, 'bar', 8),
('r_sencillito', 'Tés', 'Té Negro', 'Té negro clásico', 30, 'bar', 9),
('r_sencillito', 'Tés', 'Té de Hierbas', 'Infusión de hierbas naturales', 30, 'bar', 10),
('r_sencillito', 'Tés', 'Matcha Latte', 'Matcha latte cremoso', 55, 'bar', 11);

INSERT INTO menu_items (restaurant_id, category, name, description, price, station, sort_order) VALUES
('r_sencillito', 'Comida', 'Croissant de Jamón Serrano', 'Croissant recién horneado con jamón serrano y queso manchego, acompañado de papas', 95, 'kitchen', 12),
('r_sencillito', 'Comida', 'Bandeja Paisa', 'Bandeja paisa tradicional con frijoles, arroz, chicharrón, plátano, huevo y aguacate', 135, 'kitchen', 13),
('r_sencillito', 'Comida', 'Waffle Clásico', 'Waffle crujiente con miel y fruta fresca', 85, 'kitchen', 14),
('r_sencillito', 'Comida', 'Waffle con Chocolate', 'Waffle bañado en chocolate con frutos rojos', 95, 'kitchen', 15),
('r_sencillito', 'Comida', 'Castacón', 'Tostón de plátano verde relleno', 120, 'kitchen', 16);

INSERT INTO menu_items (restaurant_id, category, name, description, price, station, sort_order) VALUES
('r_sencillito', 'Postres', 'Pastel de Chocolate', 'Rebanada de pastel de chocolate artesanal', 65, 'kitchen', 17),
('r_sencillito', 'Postres', 'Cheesecake', 'Cheesecake cremoso de la casa', 70, 'kitchen', 18),
('r_sencillito', 'Postres', 'Galleta Artesanal', 'Galleta recién horneada', 25, 'kitchen', 19);

INSERT INTO menu_items (restaurant_id, category, name, description, price, station, sort_order) VALUES
('r_sencillito', 'Bebidas Frías', 'Limonada Natural', 'Limonada fresca natural', 35, 'bar', 20),
('r_sencillito', 'Bebidas Frías', 'Limonada de Coco', 'Limonada con agua de coco', 45, 'bar', 21),
('r_sencillito', 'Bebidas Frías', 'Coca-Cola', 'Coca-Cola 355ml', 25, 'bar', 22);

-- ============================================================================
-- 5. MAUI CAFÉ — Venezuelan-Mexican Fusion (Morelos 1045, Barrio Antiguo)
-- ============================================================================
INSERT INTO restaurants (id, name, slug, description, address, phone, cuisine_type, mode, currency, primary_color, secondary_color, accent_color) VALUES
('r_maui', 'Maui Café', 'maui-cafe', 'Fusión México-Venezuela en Barrio Antiguo. Arepas, empanadas, hamburguesas, tacos y coctelería de autor. Ambiente único.', 'José María Morelos 1045, Barrio Antiguo, Centro, 64000 Monterrey', '8181207032', 'Fusión Venezolana', 'dine-in', 'MXN', '#1A5276', '#2E86C1', '#F39C12');

INSERT INTO restaurant_owners (restaurant_id, name, phone, email) VALUES ('r_maui', 'Maui', '8181207032', 'hola@mauimty.mx');

INSERT INTO menu_items (restaurant_id, category, name, description, price, station, sort_order) VALUES
('r_maui', 'Arepas', 'Arepa Clásica', 'Arepa venezolana rellena de queso blanco', 75, 'kitchen', 1),
('r_maui', 'Arepas', 'Arepa Pelúa', 'Arepa rellena de carne mechada y queso', 95, 'kitchen', 2),
('r_maui', 'Arepas', 'Arepa Reina Pepiada', 'Arepa rellena de pollo con aguacate', 95, 'kitchen', 3),
('r_maui', 'Arepas', 'Arepa de Pernil', 'Arepa rellena de pernil de cerdo', 100, 'kitchen', 4);

INSERT INTO menu_items (restaurant_id, category, name, description, price, station, sort_order) VALUES
('r_maui', 'Entradas', 'Empanadas Venezolanas (3)', 'Tres empanadas de harina de maíz rellenas (carne, pollo o queso)', 85, 'kitchen', 5),
('r_maui', 'Entradas', 'Tequeños (6)', 'Seis palitos de queso enrollados en masa y fritos', 90, 'kitchen', 6),
('r_maui', 'Entradas', 'Nachos Maui', 'Nachos con carne, queso, guacamole y pico de gallo', 110, 'kitchen', 7),
('r_maui', 'Entradas', 'Patacón', 'Tostón de plátano verde con carne mechada y queso', 115, 'kitchen', 8);

INSERT INTO menu_items (restaurant_id, category, name, description, price, station, sort_order) VALUES
('r_maui', 'Hamburguesas', 'Hamburguesa Clásica', 'Carne angus 150g con queso, lechuga, tomate y cebolla', 110, 'kitchen', 9),
('r_maui', 'Hamburguesas', 'Hamburguesa Maui', 'Carne angus 200g con queso gouda, tocino, cebolla caramelizada y salsa especial', 135, 'kitchen', 10),
('r_maui', 'Hamburguesas', 'Hamburguesa Hawaiana', 'Carne angus con piña asada, jamón y queso', 120, 'kitchen', 11);

INSERT INTO menu_items (restaurant_id, category, name, description, price, station, sort_order) VALUES
('r_maui', 'Tacos', 'Tacos de Camarón (3)', 'Tres tacos de camarón con salsa especial', 95, 'kitchen', 12),
('r_maui', 'Tacos', 'Tacos de Arrachera (3)', 'Tres tacos de arrachera con cebolla caramelizada', 110, 'kitchen', 13),
('r_maui', 'Tacos', 'Tacos al Pastor (3)', 'Tres tacos al pastor estilo Maui', 85, 'kitchen', 14);

-- Coctelería
INSERT INTO menu_items (restaurant_id, category, name, description, price, station, sort_order) VALUES
('r_maui', 'Coctelería', 'Mojito Clásico', 'Ron, hierbabuena, limón, azúcar y soda', 168, 'bar', 15),
('r_maui', 'Coctelería', 'Mojito Tropical', 'Ron, frutas tropicales, hierbabuena y limón', 168, 'bar', 16),
('r_maui', 'Coctelería', 'Cuba Libre', 'Ron, Coca-Cola y limón', 160, 'bar', 17),
('r_maui', 'Coctelería', 'Mezcalita Cool Fruit', 'Mezcal con frutas de temporada y limón', 185, 'bar', 18),
('r_maui', 'Coctelería', 'Snow Malibu', 'Malibu, crema de coco, piña y hielo', 220, 'bar', 19),
('r_maui', 'Coctelería', 'Long Island', 'Vodka, ron, tequila, ginebra, triple sec y Coca-Cola', 250, 'bar', 20),
('r_maui', 'Coctelería', 'Pain Killer', 'Ron oscuro, crema de coco, piña y naranja', 220, 'bar', 21);

INSERT INTO menu_items (restaurant_id, category, name, description, price, station, sort_order) VALUES
('r_maui', 'Bebidas', 'Cerveza Clara', 'Cerveza clara nacional 355ml', 35, 'bar', 22),
('r_maui', 'Bebidas', 'Cerveza Oscura', 'Cerveza oscura nacional 355ml', 40, 'bar', 23),
('r_maui', 'Bebidas', 'Refresco', 'Refresco embotellado 355ml', 20, 'bar', 24),
('r_maui', 'Bebidas', 'Agua Natural', 'Agua purificada 500ml', 15, 'bar', 25),
('r_maui', 'Bebidas', 'Limonada Natural', 'Limonada fresca natural', 30, 'bar', 26);

-- ============================================================================
-- FLOOR PLANS & TABLES (sample layout for each restaurant)
-- ============================================================================

-- Di Pasquale: small intimate restaurant (8 tables)
INSERT INTO floor_plans (id, restaurant_id, canvas_w, canvas_h, grid_size) VALUES
('fp_dipasquale', 'r_dipasquale', 800, 600, 20);

INSERT INTO restaurant_tables (restaurant_id, floor_plan_id, display_name, table_number, seats, shape, x, y, width, height, rotation, chair_positions) VALUES
('r_dipasquale', 'fp_dipasquale', 'Mesa 1', 1, 2, 'square', 100, 150, 60, 60, 0, '[{"seat_number":1,"x":0,"y":-25},{"seat_number":2,"x":0,"y":25}]'),
('r_dipasquale', 'fp_dipasquale', 'Mesa 2', 2, 2, 'square', 300, 150, 60, 60, 0, '[{"seat_number":1,"x":0,"y":-25},{"seat_number":2,"x":0,"y":25}]'),
('r_dipasquale', 'fp_dipasquale', 'Mesa 3', 3, 4, 'square', 500, 150, 80, 80, 0, '[{"seat_number":1,"x":-25,"y":-25},{"seat_number":2,"x":25,"y":-25},{"seat_number":3,"x":-25,"y":25},{"seat_number":4,"x":25,"y":25}]'),
('r_dipasquale', 'fp_dipasquale', 'Mesa 4', 4, 4, 'square', 100, 350, 80, 80, 0, '[{"seat_number":1,"x":-25,"y":-25},{"seat_number":2,"x":25,"y":-25},{"seat_number":3,"x":-25,"y":25},{"seat_number":4,"x":25,"y":25}]'),
('r_dipasquale', 'fp_dipasquale', 'Mesa 5', 5, 6, 'rectangle', 300, 320, 120, 80, 0, '[{"seat_number":1,"x":-25,"y":-25},{"seat_number":2,"x":25,"y":-25},{"seat_number":3,"x":-25,"y":25},{"seat_number":4,"x":25,"y":25},{"seat_number":5,"x":0,"y":-35},{"seat_number":6,"x":0,"y":35}]'),
('r_dipasquale', 'fp_dipasquale', 'Mesa 6', 6, 4, 'circle', 550, 350, 80, 80, 0, '[{"seat_number":1,"x":0,"y":-30},{"seat_number":2,"x":30,"y":0},{"seat_number":3,"x":0,"y":30},{"seat_number":4,"x":-30,"y":0}]');

-- Bucaneros: larger restaurant (12 tables)
INSERT INTO floor_plans (id, restaurant_id, canvas_w, canvas_h, grid_size) VALUES
('fp_bucaneros', 'r_bucaneros', 1200, 800, 20);

INSERT INTO restaurant_tables (restaurant_id, floor_plan_id, display_name, table_number, seats, shape, x, y, width, height, rotation) VALUES
('r_bucaneros', 'fp_bucaneros', 'Mesa 1', 1, 2, 'square', 80, 100, 60, 60, 0),
('r_bucaneros', 'fp_bucaneros', 'Mesa 2', 2, 2, 'square', 220, 100, 60, 60, 0),
('r_bucaneros', 'fp_bucaneros', 'Mesa 3', 3, 4, 'square', 400, 80, 80, 80, 0),
('r_bucaneros', 'fp_bucaneros', 'Mesa 4', 4, 4, 'square', 600, 80, 80, 80, 0),
('r_bucaneros', 'fp_bucaneros', 'Mesa 5', 5, 2, 'square', 800, 100, 60, 60, 0),
('r_bucaneros', 'fp_bucaneros', 'Mesa 6', 6, 6, 'rectangle', 150, 300, 120, 80, 0),
('r_bucaneros', 'fp_bucaneros', 'Mesa 7', 7, 4, 'square', 400, 300, 80, 80, 0),
('r_bucaneros', 'fp_bucaneros', 'Mesa 8', 8, 4, 'square', 600, 300, 80, 80, 0),
('r_bucaneros', 'fp_bucaneros', 'Mesa 9', 9, 6, 'rectangle', 150, 500, 120, 80, 0),
('r_bucaneros', 'fp_bucaneros', 'Mesa 10', 10, 4, 'square', 400, 500, 80, 80, 0),
('r_bucaneros', 'fp_bucaneros', 'Mesa 11', 11, 4, 'square', 600, 500, 80, 80, 0),
('r_bucaneros', 'fp_bucaneros', 'Mesa 12', 12, 8, 'rectangle', 800, 350, 160, 100, 0);

-- ============================================================================
-- PROMOS (sample promotions)
-- ============================================================================
INSERT INTO promos (restaurant_id, name, description, discount_type, discount_value, original_price, category, active) VALUES
('r_dipasquale', 'Pizza + Bebida', 'Pizza individual + bebida por solo $179', 'fixed', 179, 195, 'Pizzas', true),
('r_bucaneros', 'Desayuno Completo', 'Café + desayuno tradicional a elegir', 'fixed', 169, 200, 'Desayunos', true),
('r_sencillito', 'Café + Postre', 'Americano + postre artesanal', 'fixed', 79, 97, 'Café', true),
('r_maui', '2x1 en Mojitos', 'Mojito clásico 2x1 todos los martes', 'percentage', 50, 168, 'Coctelería', true),
('r_azucarynuez', 'Cheesecake + Café', 'Rebanada de cheesecake + café americano', 'fixed', 110, 130, 'Cheesecakes', true);

-- ============================================================================
-- STAFF (sample accounts for testing)
-- ============================================================================
-- Di Pasquale staff
INSERT INTO staff (restaurant_id, name, pin, role, passcode_hash, is_active) VALUES
('r_dipasquale', 'Marco Manager', '1111', 'manager', 'hashed_1111', true),
('r_dipasquale', 'Sofia Server', '1112', 'server', 'hashed_1112', true),
('r_dipasquale', 'Luigi Chef', '1113', 'kitchen', 'hashed_1113', true),
('r_dipasquale', 'Bartender', '1114', 'bar', 'hashed_1114', true);

-- Bucaneros staff
INSERT INTO staff (restaurant_id, name, pin, role, is_active) VALUES
('r_bucaneros', 'Admin Bucanero', '2221', 'manager', true),
('r_bucaneros', 'Mesa Server', '2222', 'foh', true),
('r_bucaneros', 'Cocina Chef', '2223', 'kitchen', true);

-- ============================================================================
-- QR CODES
-- ============================================================================
INSERT INTO restaurant_qr_codes (restaurant_id, qr_type, qr_code_data) VALUES
('r_dipasquale', 'customer', 'https://restaurant-platform.vercel.app/?restaurant_id=r_dipasquale'),
('r_dipasquale', 'manager', 'https://restaurant-platform.vercel.app/staff/login?restaurant_id=r_dipasquale'),
('r_bucaneros', 'customer', 'https://restaurant-platform.vercel.app/?restaurant_id=r_bucaneros'),
('r_bucaneros', 'manager', 'https://restaurant-platform.vercel.app/staff/login?restaurant_id=r_bucaneros'),
('r_sencillito', 'customer', 'https://restaurant-platform.vercel.app/?restaurant_id=r_sencillito'),
('r_maui', 'customer', 'https://restaurant-platform.vercel.app/?restaurant_id=r_maui'),
('r_azucarynuez', 'customer', 'https://restaurant-platform.vercel.app/?restaurant_id=r_azucarynuez');

-- ============================================================================
-- PLATFORM OWNER (Martín Torres — Admin Panel Access)
-- ============================================================================
INSERT INTO platform_owner (id, email, name, passcode_hash) VALUES
('owner_martin', 'dr.mtorres@icloud.com', 'Martín Torres', 'hashed_2026');

-- ============================================================================
-- SAMPLE REVIEWS (for testing dashboard analytics)
-- ============================================================================
INSERT INTO visit_feedback (restaurant_id, rating, comment) VALUES
('r_dipasquale', 5, 'La mejor lasagna de Monterrey, increíble atención'),
('r_dipasquale', 4, 'Pizza muy buena, el lugar es acogedor'),
('r_dipasquale', 5, 'Auténtico sabor italiano, volveremos'),
('r_bucaneros', 4, 'Los huevos bucaneros son deliciosos'),
('r_bucaneros', 5, 'Excelente desayuno, el pulpo zarandeado espectacular'),
('r_sencillito', 5, 'El café de especialidad es increíble, el ambiente súper relajado'),
('r_sencillito', 4, 'Waffles deliciosos y el croissant de jamón serrano imperdible'),
('r_maui', 5, 'Las arepas pelúas son como en Venezuela, 10/10'),
('r_maui', 4, 'Los mojitos y el ambiente, perfectos para una cena'),
('r_azucarynuez', 5, 'El cheesecake de manzana es el mejor postre de Monterrey');
