--
-- PostgreSQL database dump
--

\restrict 2cWgNPpPcibJkx4Bw203qCZjiaXAF4rA0ZDQS7SMD4muc3DcGAJhRWm5Lv2fFmp

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP POLICY IF EXISTS "Public read variants" ON public.product_variants;
DROP POLICY IF EXISTS "Public read products" ON public.products;
DROP POLICY IF EXISTS "Public read images" ON public.product_images;
DROP POLICY IF EXISTS "Public read categories" ON public.categories;
DROP POLICY IF EXISTS "Public read blog_posts" ON public.blog_posts;
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS products_category_id_fkey;
ALTER TABLE IF EXISTS ONLY public.product_variants DROP CONSTRAINT IF EXISTS product_variants_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.product_images DROP CONSTRAINT IF EXISTS product_images_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.orders DROP CONSTRAINT IF EXISTS orders_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.order_items DROP CONSTRAINT IF EXISTS order_items_variant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.order_items DROP CONSTRAINT IF EXISTS order_items_order_id_fkey;
ALTER TABLE IF EXISTS ONLY public.customers DROP CONSTRAINT IF EXISTS customers_id_fkey;
ALTER TABLE IF EXISTS ONLY public.customer_addresses DROP CONSTRAINT IF EXISTS customer_addresses_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.categories DROP CONSTRAINT IF EXISTS categories_parent_id_fkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS products_slug_key;
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS products_pkey;
ALTER TABLE IF EXISTS ONLY public.product_variants DROP CONSTRAINT IF EXISTS product_variants_sku_key;
ALTER TABLE IF EXISTS ONLY public.product_variants DROP CONSTRAINT IF EXISTS product_variants_pkey;
ALTER TABLE IF EXISTS ONLY public.product_images DROP CONSTRAINT IF EXISTS product_images_pkey;
ALTER TABLE IF EXISTS ONLY public.orders DROP CONSTRAINT IF EXISTS orders_pkey;
ALTER TABLE IF EXISTS ONLY public.order_items DROP CONSTRAINT IF EXISTS order_items_pkey;
ALTER TABLE IF EXISTS ONLY public.hero_banners DROP CONSTRAINT IF EXISTS hero_banners_pkey;
ALTER TABLE IF EXISTS ONLY public.customers DROP CONSTRAINT IF EXISTS customers_pkey;
ALTER TABLE IF EXISTS ONLY public.customer_addresses DROP CONSTRAINT IF EXISTS customer_addresses_pkey;
ALTER TABLE IF EXISTS ONLY public.categories DROP CONSTRAINT IF EXISTS categories_slug_key;
ALTER TABLE IF EXISTS ONLY public.categories DROP CONSTRAINT IF EXISTS categories_pkey;
ALTER TABLE IF EXISTS ONLY public.blog_posts DROP CONSTRAINT IF EXISTS blog_posts_slug_key;
ALTER TABLE IF EXISTS ONLY public.blog_posts DROP CONSTRAINT IF EXISTS blog_posts_pkey;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.product_images;
DROP VIEW IF EXISTS public.product_catalog;
DROP TABLE IF EXISTS public.products;
DROP TABLE IF EXISTS public.product_variants;
DROP TABLE IF EXISTS public.order_items;
DROP TABLE IF EXISTS public.hero_banners;
DROP TABLE IF EXISTS public.customers;
DROP TABLE IF EXISTS public.customer_addresses;
DROP TABLE IF EXISTS public.categories;
DROP TABLE IF EXISTS public.blog_posts;
DROP FUNCTION IF EXISTS public.create_order(p_customer_id uuid, p_shipping_address text, p_phone text, p_items jsonb);
DROP TABLE IF EXISTS public.orders;
DROP TYPE IF EXISTS public.user_role;
DROP EXTENSION IF EXISTS pgcrypto;
--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'customer',
    'staff',
    'admin'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_id uuid,
    status text DEFAULT 'pending'::text,
    total numeric(12,2) NOT NULL,
    shipping_address text NOT NULL,
    phone text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT orders_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'paid'::text, 'shipped'::text, 'completed'::text, 'cancelled'::text])))
);


--
-- Name: create_order(uuid, text, text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_order(p_customer_id uuid, p_shipping_address text, p_phone text, p_items jsonb) RETURNS public.orders
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_order orders;
  v_item jsonb;
  v_variant_id uuid;
  v_quantity int;
  v_price numeric(12,2);
  v_stock int;
  v_total numeric(12,2) := 0;
BEGIN
  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'empty_cart';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_variant_id := (v_item->>'variant_id')::uuid;
    v_quantity := (v_item->>'quantity')::int;

    IF v_quantity IS NULL OR v_quantity <= 0 THEN
      RAISE EXCEPTION 'invalid_quantity:%', v_variant_id;
    END IF;

    SELECT price, stock INTO v_price, v_stock
    FROM product_variants WHERE id = v_variant_id FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'variant_not_found:%', v_variant_id;
    END IF;
    IF v_stock < v_quantity THEN
      RAISE EXCEPTION 'insufficient_stock:%', v_variant_id;
    END IF;

    v_total := v_total + (v_price * v_quantity);
  END LOOP;

  INSERT INTO orders (customer_id, status, total, shipping_address, phone)
  VALUES (p_customer_id, 'pending', v_total, p_shipping_address, p_phone)
  RETURNING * INTO v_order;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_variant_id := (v_item->>'variant_id')::uuid;
    v_quantity := (v_item->>'quantity')::int;

    SELECT price INTO v_price FROM product_variants WHERE id = v_variant_id;

    INSERT INTO order_items (order_id, variant_id, quantity, price)
    VALUES (v_order.id, v_variant_id, v_quantity, v_price);

    UPDATE product_variants SET stock = stock - v_quantity WHERE id = v_variant_id;
  END LOOP;

  RETURN v_order;
END;
$$;


--
-- Name: blog_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blog_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    excerpt text NOT NULL,
    content text NOT NULL,
    cover_image text NOT NULL,
    tag text NOT NULL,
    author_name text NOT NULL,
    read_minutes integer DEFAULT 5 NOT NULL,
    published_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    parent_id uuid,
    image_url text,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: customer_addresses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customer_addresses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_id uuid,
    recipient_name text NOT NULL,
    phone text NOT NULL,
    address_line text NOT NULL,
    city text NOT NULL,
    is_default boolean DEFAULT false
);


--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id uuid NOT NULL,
    full_name text,
    phone text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: hero_banners; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hero_banners (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    headline text NOT NULL,
    subheadline text,
    cta_label text,
    cta_url text,
    image_url text,
    badge_text text,
    display_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid,
    variant_id uuid,
    quantity integer NOT NULL,
    price numeric(12,2) NOT NULL
);


--
-- Name: product_variants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_variants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid,
    variant_name text NOT NULL,
    sku text,
    price numeric(12,2) NOT NULL,
    stock integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    category_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    specs jsonb DEFAULT '[]'::jsonb NOT NULL,
    datasheet_url text,
    library_url text,
    brand text
);


--
-- Name: product_catalog; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.product_catalog AS
 SELECT p.id,
    p.name,
    p.slug,
    p.description,
    p.category_id,
    p.brand,
    p.specs,
    p.datasheet_url,
    p.library_url,
    p.created_at,
    v.cheapest_price,
    COALESCE(v.total_stock, (0)::bigint) AS total_stock
   FROM (public.products p
     LEFT JOIN LATERAL ( SELECT min(pv.price) AS cheapest_price,
            sum(pv.stock) AS total_stock
           FROM public.product_variants pv
          WHERE (pv.product_id = p.id)) v ON (true));


--
-- Name: product_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_images (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid,
    image_url text NOT NULL,
    display_order integer DEFAULT 0
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    role public.user_role DEFAULT 'customer'::public.user_role NOT NULL
);


--
-- Data for Name: blog_posts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.blog_posts (id, title, slug, excerpt, content, cover_image, tag, author_name, read_minutes, published_at) FROM stdin;
0f7fd7ee-dfb5-4f8c-9b41-138ab4b104c5	Cách chọn board phát triển phù hợp cho dự án IoT đầu tay	cach-chon-board-phat-trien-phu-hop-cho-du-an-iot-dau-tay	Arduino, ESP32 hay Raspberry Pi? Đứng trước hàng chục loại dev board, người mới bắt đầu thường lúng túng. Bài viết này giúp bạn chọn đúng ngay từ lần đầu.	Khi mới bắt đầu với IoT, câu hỏi đầu tiên luôn là "nên mua board nào?". Thay vì chọn theo trào lưu, hãy bắt đầu từ chính yêu cầu dự án.\n\nNếu dự án chỉ cần đọc vài cảm biến và điều khiển vài relay, không cần kết nối mạng, một board Arduino Uno hoặc Nano là quá đủ — giá rẻ, tài liệu nhiều, cộng đồng lớn. Ngay khi dự án cần WiFi hoặc Bluetooth (bật đèn qua điện thoại, gửi dữ liệu lên cloud), ESP32 gần như là lựa chọn mặc định: giá rẻ hơn nhiều so với việc mua thêm module WiFi rời cho Arduino, lại có RAM và tốc độ xử lý cao hơn hẳn.\n\nCòn nếu dự án cần chạy hệ điều hành đầy đủ, xử lý ảnh, hoặc làm gateway tổng hợp dữ liệu từ nhiều thiết bị con, Raspberry Pi là lựa chọn đúng — nhưng đừng dùng Pi chỉ để nhấp nháy một con LED, vừa lãng phí vừa tốn điện hơn nhiều so với vi điều khiển.\n\nMẹo cuối: luôn thử nghiệm trên breadboard trước khi hàn cố định, và mua dư một vài linh kiện dự phòng — board vi điều khiển giá không cao, nhưng thời gian debug vì thiếu linh kiện dự phòng thì rất tốn.	https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=700&fit=crop	Hướng dẫn	Đội ngũ kỹ thuật Logilab	6	2026-06-02 02:00:00+00
d5dac676-9df7-4ad9-b7ce-b7cc46d36b43	5 lỗi thường gặp khi lập trình cảm biến DHT22/DHT11	5-loi-thuong-gap-khi-lap-trinh-cam-bien-dht22-dht11	Đọc giá trị NaN, cảm biến báo sai nhiệt độ, chương trình treo giữa chừng — đây là những lỗi kinh điển khi mới làm quen với cảm biến DHT. Cách khắc phục từng lỗi.	1. Đọc liên tục không có độ trễ: DHT11/DHT22 cần tối thiểu 1-2 giây giữa hai lần đọc để cảm biến ổn định lại. Đọc dồn dập sẽ ra kết quả NaN hoặc giá trị cũ.\n\n2. Thiếu điện trở kéo lên (pull-up resistor): chân DATA của DHT cần một điện trở khoảng 10kΩ nối lên nguồn 3.3V/5V. Thiếu điện trở này, tín hiệu trôi nổi (floating) sẽ khiến dữ liệu đọc về sai lệch ngẫu nhiên.\n\n3. Dây tín hiệu quá dài không có chống nhiễu: với khoảng cách trên 1-2 mét, nên dùng dây có bọc chống nhiễu (shielded cable) hoặc giảm tốc độ giao tiếp, nếu không tín hiệu dễ bị nhiễu điện từ.\n\n4. Cấp nguồn không ổn định: DHT khá nhạy với dao động điện áp, đặc biệt khi dùng chung nguồn với động cơ hoặc relay. Nên tách riêng nguồn cho cảm biến hoặc thêm tụ lọc nhiễu gần chân nguồn.\n\n5. Nhầm chân DATA của DHT11 và DHT22: hai loại có thứ tự chân giống nhau nhưng thư viện đọc dữ liệu (timing) khác nhau — dùng nhầm thư viện là nguyên nhân phổ biến nhất khiến người mới nghĩ cảm biến bị hỏng trong khi thực ra vẫn hoạt động tốt.	https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1200&h=700&fit=crop	Hướng dẫn	Đội ngũ kỹ thuật Logilab	7	2026-06-16 02:00:00+00
e0994f53-461b-4121-b4ad-20b47f4808a0	Xây dựng hệ thống tưới cây tự động với ESP32 và cảm biến độ ẩm đất	xay-dung-he-thong-tuoi-cay-tu-dong-voi-esp32	Một dự án cuối tuần vừa thực tế vừa dễ mở rộng: đo độ ẩm đất, tự động bật bơm mini, và xem dữ liệu từ xa qua điện thoại.	Hệ thống gồm 3 khối chính: cảm biến độ ẩm đất (loại capacitive, bền hơn loại điện trở vì không bị ăn mòn theo thời gian), ESP32 làm bộ xử lý trung tâm, và relay điều khiển bơm nước mini 5V hoặc 12V.\n\nLogic hoạt động rất đơn giản: ESP32 đọc giá trị độ ẩm mỗi 10-15 phút, nếu thấp hơn ngưỡng đặt trước (ví dụ 30%) thì kích relay bật bơm trong vài giây rồi tắt, tránh tưới ngập úng. Toàn bộ ngưỡng và lịch trình nên lưu vào bộ nhớ không mất khi mất điện (NVS trên ESP32) để không phải cấu hình lại mỗi lần khởi động.\n\nĐể xem dữ liệu từ xa, cách đơn giản nhất là dùng ESP32 kết nối WiFi nhà, gửi dữ liệu định kỳ lên một dashboard IoT miễn phí qua giao thức MQTT — không cần tự dựng server riêng.\n\nMở rộng thêm: gắn thêm cảm biến ánh sáng để chỉ tưới vào sáng sớm hoặc chiều mát, tránh tưới giữa trưa nắng gắt gây sốc nhiệt cho rễ cây.	https://images.unsplash.com/photo-1515150144380-bca9f1650ed9?w=1200&h=700&fit=crop	Dự án DIY	Đội ngũ kỹ thuật Logilab	8	2026-06-23 02:00:00+00
1d5d8351-9547-4eed-badf-9a91bf5b802c	Nguồn điện cho dự án nhúng: Chọn pin Li-ion hay adapter 5V?	nguon-dien-cho-du-an-nhung-chon-pin-li-ion-hay-adapter-5v	Nguồn điện là phần hay bị bỏ qua nhất khi lên kế hoạch dự án, nhưng lại là nguyên nhân phổ biến nhất khiến board hoạt động chập chờn.	Nếu dự án cố định một chỗ, có ổ điện gần đó, dùng adapter 5V (qua cổng USB hoặc jack DC) luôn là lựa chọn đơn giản và ổn định nhất — không cần lo về sạc/xả pin, dòng điện ra ổn định.\n\nVới dự án cần di động hoặc đặt ở nơi không có điện lưới, pin Li-ion (dạng 18650 phổ biến nhất) là lựa chọn phù hợp nhờ mật độ năng lượng cao. Nhưng cần lưu ý ba điểm bắt buộc: dùng mạch sạc/xả chuyên dụng (TP4056 hoặc tương đương) để tránh sạc quá áp gây phồng pin; luôn có mạch bảo vệ chống xả kiệt (pin Li-ion xả dưới khoảng 2.5V/cell dễ hỏng vĩnh viễn); và không đặt pin gần nguồn nhiệt hoặc để ở nơi nắng gắt.\n\nMột lỗi rất phổ biến ở người mới: cấp nguồn 5V trực tiếp từ pin 3.7V qua mạch boost giá rẻ, không đủ dòng cho ESP32 khi WiFi hoạt động ở công suất phát cao — board bị reset liên tục dù pin vẫn còn nhiều. Nên chọn mạch boost/regulator có dòng ra tối thiểu 1A và có tụ lọc đủ lớn gần chân nguồn của board.\n\nVới dự án chạy pin nhiều tháng không cần sạc, pin lithium dạng coin (CR2032) kết hợp chế độ deep sleep là hướng đi tiết kiệm và đơn giản hơn nhiều so với pin sạc.	https://images.unsplash.com/photo-1576834975354-ee694be1f0d1?w=1200&h=700&fit=crop	Hướng dẫn	Đội ngũ kỹ thuật Logilab	7	2026-07-04 02:00:00+00
a2d97df1-28bc-4b48-b8a1-49be534f228d	Làm trạm giám sát chất lượng không khí với cảm biến PM2.5	lam-tram-giam-sat-chat-luong-khong-khi-voi-cam-bien-pm25	Bụi mịn PM2.5 ngày càng được quan tâm ở các thành phố lớn. Một trạm đo mini dùng ESP32 có thể giúp bạn theo dõi chất lượng không khí ngay tại nhà.	Cảm biến bụi mịn quang học (loại phổ biến nhất cho dự án DIY) hoạt động bằng cách chiếu tia laser qua luồng không khí và đo ánh sáng tán xạ để ước tính nồng độ hạt bụi — độ chính xác không bằng thiết bị đo chuyên dụng nhưng đủ tốt để theo dõi xu hướng theo thời gian.\n\nKhi đấu nối, lưu ý cảm biến loại này thường cần quạt hút nhỏ tích hợp để tạo luồng khí ổn định qua khoang cảm biến — nguồn cấp cho quạt nên tách riêng khỏi nguồn logic để tránh nhiễu vào tín hiệu đo.\n\nESP32 đọc dữ liệu qua UART, tính toán chỉ số AQI tương đối, rồi hiển thị lên màn hình OLED nhỏ đặt tại nhà hoặc gửi lên dashboard để xem xu hướng theo ngày/tuần. Nên đặt cảm biến ở độ cao ngang tầm thở (1-1.5 mét), tránh đặt sát cửa sổ hướng gió trực tiếp vì dễ cho kết quả dao động mạnh.\n\nDữ liệu thu được nên hiệu chỉnh định kỳ (calibrate) so với nguồn dữ liệu chất lượng không khí công khai của khu vực, vì cảm biến giá rẻ có thể lệch theo thời gian sử dụng.	https://images.unsplash.com/photo-1754373218517-18c577811d0d?w=1200&h=700&fit=crop	Dự án DIY	Đội ngũ kỹ thuật Logilab	7	2026-07-10 02:00:00+00
26df8aca-a208-44f6-bf96-17bb30e4f13f	Bảo quản và test linh kiện điện tử tồn kho lâu ngày	bao-quan-va-test-linh-kien-dien-tu-ton-kho-lau-ngay	Linh kiện mua về chưa dùng ngay, để lâu trong ngăn kéo có còn hoạt động tốt không? Cách bảo quản đúng và kiểm tra nhanh trước khi lắp vào dự án.	IC và vi điều khiển thường có tuổi thọ bảo quản rất dài nếu để đúng cách — nơi khô ráo, tránh ẩm và tránh tĩnh điện. Với linh kiện nhạy tĩnh điện (ESD-sensitive) như MOSFET hay IC logic, nên giữ nguyên trong túi chống tĩnh điện (túi màu đen hoặc hồng) cho đến khi thực sự sử dụng.\n\nTụ điện hoá (electrolytic capacitor) là linh kiện dễ xuống cấp theo thời gian nhất, kể cả khi chưa dùng — dung dịch điện phân bên trong có thể khô dần. Với tụ để trên 2-3 năm, nên đo lại điện dung bằng đồng hồ đo LCR trước khi lắp vào mạch nguồn, tránh tình trạng mạch hoạt động chập chờn khó tìm nguyên nhân.\n\nPin sạc (Li-ion, Li-Po) tuyệt đối không nên để tồn kho ở trạng thái xả cạn hoặc sạc đầy 100% trong thời gian dài — mức sạc lý tưởng để lưu trữ lâu là khoảng 40-60%, kiểm tra định kỳ mỗi vài tháng.\n\nVới cảm biến quang (LDR, photodiode) hoặc cảm biến độ ẩm, nên test nhanh bằng mạch thử đơn giản trước khi hàn cố định vào board chính — chi phí một lần test luôn rẻ hơn nhiều so với việc phải tháo hàn lại toàn bộ mạch sau này.	https://images.unsplash.com/photo-1591405351990-4726e331f141?w=1200&h=700&fit=crop	Hướng dẫn	Đội ngũ kỹ thuật Logilab	6	2026-07-13 02:00:00+00
8869f38f-2124-449b-96b8-8f0e8300a1db	ESP32 vs Raspberry Pi Pico: Nên chọn board nào cho dự án của bạn?	esp32-vs-raspberry-pi-pico-nen-chon-board-nao	Cùng tầm giá, cùng kích thước nhỏ gọn, nhưng ESP32 và Raspberry Pi Pico phục vụ hai nhóm nhu cầu rất khác nhau. So sánh chi tiết để tránh chọn nhầm.	ESP32 và Raspberry Pi Pico (RP2040/RP2350) thường bị so sánh vì cùng là vi điều khiển giá rẻ, kích thước nhỏ. Nhưng điểm khác biệt lớn nhất nằm ở kết nối không dây: ESP32 tích hợp sẵn WiFi và Bluetooth, trong khi Pico bản gốc hoàn toàn không có (trừ bản Pico W).\n\nVề hiệu năng xử lý thuần, RP2040/RP2350 có kiến trúc dual-core Cortex-M0+/M33 mạnh về xử lý tín hiệu thời gian thực nhờ tính năng PIO (Programmable I/O) độc đáo — rất hợp cho các dự án cần timing cực chính xác như điều khiển động cơ bước, giao tiếp giao thức tùy biến. ESP32 lại mạnh hơn ở khả năng kết nối mạng và xử lý đa nhiệm nhờ FreeRTOS tích hợp sẵn trong SDK.\n\nVề điện năng tiêu thụ khi ở chế độ deep sleep, cả hai đều có thể xuống mức micro-ampe, phù hợp cho thiết bị chạy pin lâu dài, miễn là code được tối ưu đúng cách.\n\nTóm lại: cần kết nối WiFi/Bluetooth trực tiếp → chọn ESP32. Cần xử lý tín hiệu thời gian thực chính xác hoặc đã có sẵn module kết nối riêng → Pico là lựa chọn gọn nhẹ và tiết kiệm hơn.	https://images.unsplash.com/photo-1610812387871-806d3db9f5aa?w=1200&h=700&fit=crop	So sánh	Đội ngũ kỹ thuật Logilab	5	2026-06-09 02:00:00+00
359f2bb9-480c-46bb-8018-b11773fa7b29	Smart Home 2026: Xu hướng kết nối Zigbee, Matter và Thread	smart-home-2026-xu-huong-ket-noi-zigbee-matter-thread	Hệ sinh thái Smart Home từng phân mảnh vì mỗi hãng một chuẩn kết nối riêng. Matter đang thay đổi cuộc chơi như thế nào?	Trong nhiều năm, người dùng Smart Home phải chấp nhận việc thiết bị hãng A không nói chuyện được với app hãng B. Zigbee và Z-Wave giải quyết một phần vấn đề ở tầng kết nối không dây tiết kiệm điện, nhưng vẫn cần hub trung gian và tầng phần mềm riêng cho từng hãng.\n\nMatter — chuẩn mở được hậu thuẫn bởi các tên tuổi lớn trong ngành nhà thông minh — hướng tới giải quyết đúng vấn đề đó ở tầng ứng dụng: một thiết bị hỗ trợ Matter có thể được thêm vào bất kỳ app điều khiển nào hỗ trợ chuẩn này, không phân biệt hãng sản xuất.\n\nThread, chuẩn mạng lưới (mesh network) tiết kiệm điện dựa trên IPv6, thường đi kèm Matter làm tầng truyền dẫn không dây — mỗi thiết bị Thread vừa là điểm cuối vừa là điểm chuyển tiếp tín hiệu, giúp mạng lưới nhà thông minh ổn định hơn khi số lượng thiết bị tăng lên.\n\nVới người mới xây dựng hệ thống Smart Home, lời khuyên thực tế: ưu tiên thiết bị có hỗ trợ Matter ngay từ đầu để tránh phải thay thế toàn bộ hệ sinh thái sau này khi chuẩn cũ dần bị thay thế.	https://images.unsplash.com/photo-1558002038-1055907df827?w=1200&h=700&fit=crop	Tin tức	Đội ngũ kỹ thuật Logilab	6	2026-06-30 02:00:00+00
4c42ea25-5f8e-41e9-8ae4-08fe6b8fc36e	So sánh Arduino Uno, Nano và Mega: Nên bắt đầu từ đâu?	so-sanh-arduino-uno-nano-mega-nen-bat-dau-tu-dau	Cùng họ Arduino, cùng lập trình bằng Arduino IDE, nhưng Uno, Nano và Mega phù hợp với ba quy mô dự án hoàn toàn khác nhau.	Arduino Uno là board "chuẩn" được dùng trong hầu hết tài liệu, khoá học nhập môn — số lượng chân I/O vừa đủ cho các dự án học tập cơ bản, dễ tìm shield mở rộng, giá thành hợp lý.\n\nArduino Nano dùng chung vi điều khiển với Uno (ATmega328P) nhưng đóng gói nhỏ gọn hơn nhiều, cắm trực tiếp vào breadboard mà không cần dây nối rời. Đánh đổi là ít chân hơn một chút và không có jack nguồn DC sẵn — phù hợp khi dự án cần thu nhỏ kích thước sau giai đoạn thử nghiệm trên Uno.\n\nArduino Mega dùng vi điều khiển ATmega2560 mạnh hơn hẳn, với 54 chân I/O số và bộ nhớ chương trình lớn gấp 4 lần Uno — cần thiết khi dự án phải đọc nhiều cảm biến, điều khiển nhiều động cơ/relay cùng lúc, hoặc code quá lớn không còn vừa bộ nhớ của Uno.\n\nLời khuyên cho người mới: bắt đầu với Uno để học và thử nghiệm, chuyển sang Nano khi cần đóng gói gọn cho sản phẩm cuối, và chỉ nhảy sang Mega khi thực sự thiếu chân I/O hoặc bộ nhớ — không nên mua Mega ngay từ đầu chỉ vì "mạnh hơn".	https://images.unsplash.com/photo-1621136429581-bf0890d5ac22?w=1200&h=700&fit=crop	So sánh	Đội ngũ kỹ thuật Logilab	6	2026-07-07 02:00:00+00
15dabcb8-b59c-406a-b99b-54e98e1bc2f3	Cẩm nang bắt đầu dự án Robotics: từ linh kiện rời đến robot hoàn chỉnh	cam-nang-bat-dau-du-an-robotics-tu-linh-kien-den-robot-hoan-chinh	Muốn tự chế tạo robot nhưng không biết bắt đầu từ đâu? Từ khung sườn, động cơ, driver đến bộ não điều khiển — lộ trình đầy đủ cho người mới.	Một dự án robotics, dù đơn giản như robot dò line hay phức tạp như cánh tay gắp vật, đều xoay quanh 4 khối chính: khung sườn (chassis), động cơ/truyền động, driver điều khiển động cơ, và bộ não xử lý.\n\nVới người mới, nên bắt đầu từ robot 2-4 bánh dùng động cơ DC giảm tốc (gear motor) thay vì servo hay stepper — dễ điều khiển tốc độ bằng tín hiệu PWM qua driver L298N hoặc TB6612, giá rẻ và tài liệu hướng dẫn rất nhiều. Khi đã quen, chuyển sang robot cần độ chính xác vị trí (cánh tay, gripper) mới cần tới servo hoặc stepper.\n\nBộ não điều khiển nên chọn theo độ phức tạp: Arduino Uno/Nano đủ cho robot dò line hoặc tránh vật cản cơ bản; ESP32 phù hợp khi cần điều khiển từ xa qua WiFi/Bluetooth; còn robot cần xử lý ảnh (nhận diện vật thể, theo dõi màu) nên dùng Raspberry Pi làm bộ xử lý chính, kết hợp vi điều khiển phụ để điều khiển động cơ thời gian thực.\n\nMột điểm hay bị bỏ qua: nguồn điện cho động cơ phải tách riêng khỏi nguồn logic của board điều khiển. Động cơ khi khởi động hoặc đổi chiều đột ngột tạo ra dòng ngược (back-EMF) đủ để làm board bị reset nếu dùng chung nguồn — luôn thêm diode chống ngược và tụ lọc gần driver động cơ.\n\nLộ trình gợi ý: robot dò line (1 tuần) → robot tránh vật cản dùng cảm biến siêu âm (1 tuần) → robot điều khiển qua app điện thoại bằng ESP32 (2 tuần) → cánh tay gắp vật đơn giản (3-4 tuần). Mỗi bước đều tái dùng phần lớn linh kiện của bước trước, không lãng phí.	https://images.unsplash.com/photo-1716191299980-a6e8827ba10b?w=1200&h=700&fit=crop	Hướng dẫn	Đội ngũ kỹ thuật Logilab	8	2026-07-15 02:00:00+00
7b31b773-8b3b-4a3a-accb-175786c4b781	AIoT là gì? Giám sát và tự động hoá thông minh với module AI + IoT	aiot-la-gi-giam-sat-tu-dong-hoa-thong-minh-voi-module-aiot	AIoT — sự kết hợp giữa AI và IoT — đang thay đổi cách các hệ thống giám sát hoạt động: không chỉ thu thập dữ liệu mà còn tự "hiểu" và phản ứng ngay tại thiết bị.	IoT truyền thống chủ yếu làm 2 việc: thu thập dữ liệu từ cảm biến và gửi lên cloud để xử lý. AIoT (AI + IoT) đẩy một phần xử lý thông minh đó xuống ngay thiết bị biên (edge device) — camera AI có thể tự nhận diện người/vật thể ngay trên chip mà không cần gửi toàn bộ video lên server, giảm độ trễ và tiết kiệm băng thông đáng kể.\n\nBa thành phần thường thấy trong một hệ thống AIoT giám sát: camera AI tích hợp chip xử lý học sâu (nhận diện chuyển động, khuôn mặt, biển số...), cảm biến định vị GNSS cho ứng dụng theo dõi vị trí thời gian thực, và gateway LoRaWAN để gom dữ liệu từ nhiều cảm biến rải rác trên diện rộng (nông trại, kho bãi, khu công nghiệp) về một điểm tập trung mà không cần WiFi phủ khắp nơi.\n\nLoRaWAN đặc biệt phù hợp cho AIoT diện rộng vì tầm phát xa (vài km ở khu vực trống trải) và tiêu thụ điện cực thấp — một cảm biến chạy pin có thể hoạt động nhiều năm mà không cần thay pin, đánh đổi bằng băng thông truyền dữ liệu thấp (không phù hợp truyền video, chỉ hợp để gửi vài byte dữ liệu cảm biến).\n\nKhi thiết kế hệ thống AIoT, nên phân tầng rõ: dữ liệu cần phản ứng tức thời (phát hiện xâm nhập, cảnh báo cháy) xử lý ngay ở edge; dữ liệu cần phân tích xu hướng dài hạn (lưu lượng người qua lại theo giờ) mới cần gửi lên cloud để tổng hợp. Thiết kế sai tầng này là nguyên nhân phổ biến khiến hệ thống vừa tốn chi phí cloud vừa phản ứng chậm.	https://images.unsplash.com/photo-1753039495488-434a2fe53e41?w=1200&h=700&fit=crop	Hướng dẫn	Đội ngũ kỹ thuật Logilab	7	2026-07-16 02:00:00+00
964e3b62-db8d-4028-90d6-6ac507d67e37	Bắt đầu chế tạo drone FPV: flight controller, động cơ và khung sườn	bat-dau-che-tao-drone-fpv-flight-controller-dong-co-khung-suon	Tự lắp một chiếc drone FPV từ linh kiện rời khó hơn mua drone lắp sẵn, nhưng cho phép tuỳ biến hoàn toàn theo nhu cầu bay. Bắt đầu từ đâu và cần lưu ý gì?	Một drone FPV (First Person View) gồm 5 khối chính: khung sườn (frame), động cơ brushless kèm ESC (bộ điều tốc điện tử), flight controller (bo mạch xử lý trung tâm chạy firmware bay), hệ thống thu phát hình ảnh FPV, và pin LiPo.\n\nKhung sườn nên chọn theo kích thước cánh quạt định dùng — khung 5 inch là kích thước phổ biến nhất cho drone đua/freestyle, cân bằng tốt giữa tốc độ và độ ổn định khi mới học bay. Khung nhỏ hơn (3 inch) nhẹ và an toàn hơn để tập bay trong nhà.\n\nFlight controller thường tích hợp sẵn cảm biến gyro/accelerometer để giữ thăng bằng, chạy firmware mã nguồn mở (phổ biến nhất là Betaflight) — việc tinh chỉnh PID (thông số điều khiển ổn định) trong firmware là bước quan trọng nhất quyết định drone bay êm hay "lắc" khó kiểm soát, và cần tinh chỉnh lại mỗi khi đổi động cơ hoặc cánh quạt.\n\nMột lỗi rất phổ biến ở người mới ráp drone: chọn động cơ có chỉ số KV (số vòng quay trên mỗi volt) không khớp với cỡ cánh quạt và điện áp pin — động cơ KV cao (2400-2600KV) hợp với cánh nhỏ và pin cell thấp (3S-4S), trong khi động cơ KV thấp (1700-1900KV) cần cánh lớn hơn và thường dùng pin 6S để tạo đủ lực đẩy mà không đốt cháy ESC.\n\nVề an toàn: luôn kiểm tra hướng quay cánh quạt khớp với chiều quay động cơ trước khi cấp pin lần đầu, và luôn tháo cánh quạt khi test firmware/cấu hình để tránh tai nạn.	https://images.unsplash.com/photo-1512078674698-18572e3e0d6b?w=1200&h=700&fit=crop	Hướng dẫn	Đội ngũ kỹ thuật Logilab	8	2026-07-17 02:00:00+00
4017050b-da52-43f9-969d-89703a434165	Chọn màn hình hiển thị cho dự án nhúng: LCD, OLED, e-ink và cảm ứng	chon-man-hinh-hien-thi-cho-du-an-nhung-lcd-oled-e-ink-cam-ung	Mỗi loại màn hình — LCD, OLED, e-ink hay cảm ứng — có điểm mạnh riêng, không có loại nào "tốt nhất" cho mọi dự án. So sánh để chọn đúng ngay từ đầu.	LCD (thường gặp nhất là loại 16x2 hoặc TFT màu) có ưu điểm giá rẻ, độ sáng tốt trong điều kiện ánh sáng thường, phù hợp hiển thị thông số đo liên tục (nhiệt độ, độ ẩm, trạng thái hệ thống) trên các dự án chạy nguồn ổn định.\n\nOLED (phổ biến ở kích thước nhỏ 0.96-1.3 inch, giao tiếp I2C) có độ tương phản cực cao vì mỗi điểm ảnh tự phát sáng (không cần đèn nền), tiêu thụ điện thấp hơn LCD khi hiển thị nền đen — rất hợp cho thiết bị nhỏ gọn chạy pin cần hiển thị vài dòng thông tin. Nhược điểm là kích thước lớn hơn có giá tăng nhanh và tuổi thọ điểm ảnh (burn-in) nếu hiển thị hình tĩnh liên tục trong thời gian rất dài.\n\nMàn hình e-ink gần như không tiêu thụ điện khi hiển thị hình tĩnh (chỉ tốn điện lúc đổi nội dung), đọc rõ dưới ánh nắng trực tiếp — lựa chọn lý tưởng cho thiết bị hiển thị ngoài trời hoặc cần chạy pin hàng tháng mà không cần cập nhật liên tục (bảng giá điện tử, trạm thời tiết mini). Đánh đổi là tốc độ làm mới rất chậm (vài trăm mili-giây đến vài giây), không phù hợp hiển thị nội dung thay đổi nhanh.\n\nMàn hình cảm ứng (thường là TFT tích hợp lớp cảm ứng điện dung hoặc điện trở) phù hợp khi dự án cần giao diện tương tác trực tiếp thay vì chỉ đọc dữ liệu — nhưng cần lưu ý driver cảm ứng thường chiếm thêm chân giao tiếp và cần thư viện đồ hoạ phức tạp hơn nhiều so với chỉ hiển thị văn bản đơn giản.\n\nGợi ý nhanh: cần xem dữ liệu liên tục, giá rẻ → LCD. Cần gọn nhẹ, tương phản cao, chạy pin → OLED. Cần đọc ngoài trời, cực tiết kiệm điện → e-ink. Cần thao tác chạm trực tiếp trên thiết bị → màn hình cảm ứng.	https://images.unsplash.com/photo-1781390200500-ee4a3f379d66?w=1200&h=700&fit=crop	So sánh	Đội ngũ kỹ thuật Logilab	7	2026-07-17 08:00:00+00
06a3344a-0b44-4c89-af75-f357e76831b7	Trang bị xưởng chế tạo DIY tại nhà: dụng cụ và phụ kiện cần có	trang-bi-xuong-che-tao-diy-tai-nha-dung-cu-va-phu-kien-can-co	Một góc làm việc gọn gàng với đúng dụng cụ giúp tiết kiệm rất nhiều thời gian debug mạch điện. Danh sách trang bị cần thiết cho dân DIY và kỹ sư tại nhà.	Bộ dụng cụ nền tảng cho bất kỳ góc làm việc điện tử nào gồm: mỏ hàn có điều chỉnh nhiệt độ (không nên dùng loại nhiệt độ cố định vì dễ làm hỏng linh kiện nhạy nhiệt), đồng hồ vạn năng (multimeter) để đo điện áp/dòng điện/thông mạch, và breadboard cùng dây jumper để thử nghiệm mạch trước khi hàn cố định.\n\nVới người làm việc thường xuyên với vi điều khiển, nên đầu tư thêm máy hiện sóng (oscilloscope) giá rẻ dạng USB hoặc cầm tay — công cụ này giúp nhìn thấy tín hiệu thực tế theo thời gian, cực kỳ hữu ích khi debug lỗi giao tiếp I2C/SPI/UART mà multimeter không thể hiện được (multimeter chỉ đo giá trị trung bình, không thấy được dạng sóng hay nhiễu).\n\nNguồn điện thí nghiệm (bench power supply) có thể chỉnh điện áp và giới hạn dòng là khoản đầu tư đáng giá tiếp theo — giúp test mạch an toàn hơn nhiều so với cắm thẳng pin hay adapter, vì giới hạn dòng sẽ tự ngắt khi mạch bị chập thay vì làm cháy linh kiện.\n\nVề tổ chức: linh kiện nhỏ (điện trở, tụ, IC) nên phân loại theo hộp có ngăn chia rõ ràng và dán nhãn giá trị — thời gian tìm sai linh kiện trong đống hỗn độn thường tốn hơn nhiều so với thời gian thực sự sửa mạch. Với linh kiện nhạy tĩnh điện, luôn có một tấm thảm chống tĩnh điện (ESD mat) và vòng đeo tay chống tĩnh điện tại vị trí thao tác chính.\n\nCuối cùng, đừng bỏ qua kính lúp có đèn hoặc kính hiển vi mini — với các mạch hàn linh kiện dán (SMD) ngày càng nhỏ, mắt thường rất khó phát hiện các lỗi hàn dính chân (solder bridge) là nguyên nhân phổ biến gây lỗi mạch khó hiểu.	https://images.unsplash.com/photo-1767448068187-5be3cbc848c7?w=1200&h=700&fit=crop	Hướng dẫn	Đội ngũ kỹ thuật Logilab	7	2026-07-18 02:00:00+00
ceefda67-0850-49e8-9d6a-d9856597122b	Cánh tay robot & gripper: nguyên lý hoạt động và cách chọn linh kiện	canh-tay-robot-va-gripper-nguyen-ly-hoat-dong-va-cach-chon-linh-kien	Gắp - đặt tự động là một trong những ứng dụng robotics phổ biến nhất, nhưng cũng dễ chọn sai linh kiện nhất nếu không hiểu rõ yêu cầu về lực và độ chính xác.	Một cánh tay robot cơ bản gồm nhiều khớp nối tiếp (thường 3-6 bậc tự do/DOF), mỗi khớp dùng một servo hoặc động cơ riêng để xoay — số bậc tự do càng nhiều, cánh tay càng linh hoạt trong việc tiếp cận vật thể ở nhiều góc độ, nhưng đồng thời việc tính toán động học (kinematics) để điều khiển chính xác cũng phức tạp hơn nhiều.\n\nVới dự án học tập hoặc gắp - đặt đơn giản (pick and place cố định 1 vị trí), cánh tay 4 DOF dùng servo TTL/PWM thông thường là đủ. Servo TTL (giao tiếp qua tín hiệu số, thường 1 dây data) có ưu điểm đọc được vị trí thực tế và lực hiện tại, hữu ích khi cần phát hiện va chạm hoặc điều chỉnh lực gắp theo phản hồi thời gian thực — điều mà servo PWM thường (điều khiển vòng hở) không làm được.\n\nPhần gripper (bộ phận kẹp/gắp ở đầu cánh tay) cần chọn theo hình dạng và độ cứng của vật cần gắp: gripper 2 ngón song song phù hợp vật hình hộp/trụ đơn giản; gripper dạng "bàn tay" nhiều ngón phù hợp vật hình dạng phức tạp nhưng đắt và nặng hơn nhiều; gripper hút chân không (vacuum gripper) lại phù hợp vật phẳng, mỏng, dễ vỡ (tấm kính, hộp giấy) mà gripper cơ khí dễ làm hỏng.\n\nMột yếu tố hay bị bỏ qua khi thiết kế: tổng trọng lượng vật cần gắp cộng với trọng lượng bản thân gripper phải nằm trong giới hạn tải (payload) của servo ở khớp gốc — vì khớp gốc phải chịu mô-men xoắn của toàn bộ cánh tay phía trên, không chỉ riêng trọng lượng vật gắp. Chọn servo momen xoắn (torque) dư ra ít nhất 30-50% so với tính toán lý thuyết để tránh servo quá tải và nóng máy khi hoạt động liên tục.	https://images.unsplash.com/photo-1752614671144-7eee784abf74?w=1200&h=700&fit=crop	Hướng dẫn	Đội ngũ kỹ thuật Logilab	8	2026-07-18 08:00:00+00
3b4f5063-a988-407b-8b8c-a000caa2b6ef	Servo, động cơ DC hay động cơ bước: chọn đúng loại chuyển động cho dự án	servo-dong-co-dc-hay-dong-co-buoc-chon-dung-loai-chuyen-dong	Cả ba đều tạo ra chuyển động quay, nhưng servo, động cơ DC và động cơ bước (stepper) phù hợp với ba bài toán hoàn toàn khác nhau. Chọn nhầm là nguyên nhân phổ biến khiến dự án chạy không như ý.	Động cơ DC giảm tốc (gear motor) là lựa chọn đơn giản nhất khi chỉ cần quay liên tục một chiều với tốc độ điều khiển được (qua PWM) — phù hợp bánh xe robot, quạt, băng chuyền. Ưu điểm là giá rẻ, dễ điều khiển bằng driver cơ bản (L298N, TB6612), nhưng không kiểm soát được vị trí góc quay chính xác nếu không gắn thêm encoder.\n\nServo được thiết kế chuyên để giữ một vị trí góc cụ thể (thường 0-180 độ hoặc 0-270 độ với servo tiêu chuẩn) và tự động giữ nguyên vị trí đó chống lại lực tác động bên ngoài nhờ mạch điều khiển vòng kín tích hợp sẵn bên trong. Đây là lựa chọn đúng cho cánh tay robot, bánh lái, hoặc bất kỳ ứng dụng nào cần "đi tới góc X và giữ nguyên đó".\n\nĐộng cơ bước (stepper) chia một vòng quay thành nhiều bước rời rạc cố định (phổ biến 200 bước/vòng, tương đương 1.8 độ/bước), cho phép điều khiển vị trí và tốc độ cực chính xác mà không cần cảm biến phản hồi — vì driver luôn biết chính xác đã ra lệnh bao nhiêu bước. Đây là lựa chọn đúng cho máy in 3D, máy CNC mini, hoặc bất kỳ ứng dụng nào cần lặp lại chính xác cùng một chuyển động nhiều lần liên tục.\n\nĐánh đổi lớn nhất của động cơ bước: tiêu thụ điện ngay cả khi đứng yên (để giữ vị trí, gọi là holding torque) và dễ bị "mất bước" (skip step) nếu tải quá nặng so với momen xoắn của động cơ — mất bước không được driver phát hiện, dẫn tới sai lệch vị trí tích luỹ dần theo thời gian mà hệ thống không hề biết, trừ khi gắn thêm encoder để kiểm tra.\n\nQuy tắc chọn nhanh: cần quay liên tục, không cần biết vị trí chính xác → động cơ DC. Cần giữ đúng 1 góc cụ thể → servo. Cần di chuyển chính xác nhiều bước lặp lại → động cơ bước.	https://images.unsplash.com/photo-1779680057959-11adee4dbc9e?w=1200&h=700&fit=crop	So sánh	Đội ngũ kỹ thuật Logilab	8	2026-07-19 02:00:00+00
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categories (id, name, slug, parent_id, image_url, display_order, created_at) FROM stdin;
22222222-2222-2222-2222-222222222222	Smart Home	smart-home	\N	\N	2	2026-06-12 12:07:39.638383+00
f7fa2bc8-0760-4de6-959e-5644aa29e711	Arduino	arduino	11111111-1111-1111-1111-111111111111	\N	1	2026-06-12 12:07:39.638383+00
39134aff-aaad-4c80-b32b-8778c24e6781	STM32	stm32	11111111-1111-1111-1111-111111111111	\N	2	2026-06-12 12:07:39.638383+00
dd8a29c3-94d4-42cc-803a-dbd5d09ba482	ESP32 / ESP8266	esp32-esp8266	11111111-1111-1111-1111-111111111111	\N	3	2026-06-12 12:07:39.638383+00
ed3c7c1a-8972-4bd0-bc93-1de53715d674	Raspberry Pi	raspberry-pi	11111111-1111-1111-1111-111111111111	\N	4	2026-06-12 12:07:39.638383+00
1b7b18bb-835a-4672-bb67-7d18fd421aa9	Nguồn & Pin	nguon-pin	\N	\N	5	2026-07-10 06:46:05.023555+00
8e694265-f3e2-4f13-b7d1-96aa89b089c1	Thiết bị văn phòng	thiet-bi-van-phong	\N	\N	8	2026-07-10 07:22:10.606837+00
11111111-1111-1111-1111-111111111111	Dev Board	dev-board	\N	\N	1	2026-06-12 12:07:39.638383+00
3b540004-b6f6-4597-9190-fd4fcdaf41ab	AIOT	aiot	\N	\N	4	2026-07-10 06:46:05.023555+00
33333333-3333-3333-3333-333333333333	Camera & Security	camera-security	22222222-2222-2222-2222-222222222222	\N	3	2026-06-12 12:07:39.638383+00
a9b909e7-5938-4dbf-a198-330933ba2249	Drone	drone	\N	\N	3	2026-07-10 08:57:23.137466+00
0a92ed93-8921-45d8-ae28-e98cbe69f481	DIY & Workshop	diy-workshop	\N	\N	7	2026-07-10 06:46:05.023555+00
7d66f013-4219-4f4e-aa97-da92ef23d788	Robotics	robotics	\N	\N	9	2026-07-10 09:43:05.869949+00
3326e22d-68ad-4251-8370-50eab9e73bcb	Display	display	\N	\N	6	2026-07-10 06:46:05.023555+00
6e358120-bc7a-4488-bcf9-c01f2887c243	Chiếu sáng thông minh	chieu-sang-thong-minh	22222222-2222-2222-2222-222222222222	\N	1	2026-07-10 14:29:48.15779+00
61e92e69-b209-4cb5-947f-d5c25a659f98	Ổ cắm & Công tắc thông minh	o-cam-cong-tac-thong-minh	22222222-2222-2222-2222-222222222222	\N	2	2026-07-10 14:29:48.15779+00
5a8687d5-47ad-41c2-b4f5-5920ad84f332	Khoá & Kiểm soát ra vào	khoa-kiem-soat-ra-vao	22222222-2222-2222-2222-222222222222	\N	3	2026-07-10 14:29:48.15779+00
cb5c0558-764f-4fea-916c-d1e25baf3328	Cảm biến thông minh	cam-bien-thong-minh	22222222-2222-2222-2222-222222222222	\N	4	2026-07-10 14:29:48.15779+00
12b8c28d-61b5-4901-be70-894a420c4dc3	Trung tâm điều khiển & Loa thông minh	trung-tam-dieu-khien-loa-thong-minh	22222222-2222-2222-2222-222222222222	\N	5	2026-07-10 14:29:48.15779+00
a23ed967-fdb7-4b3a-84ff-abc3ca9f77ff	Thiết bị mạng	thiet-bi-mang	8e694265-f3e2-4f13-b7d1-96aa89b089c1	\N	1	2026-07-10 14:29:48.15779+00
d6048dd4-ffd3-4c14-8e27-170b938ed8d3	Lưu điện & Nguồn	luu-dien-nguon	8e694265-f3e2-4f13-b7d1-96aa89b089c1	\N	2	2026-07-10 14:29:48.15779+00
0cc712b8-8378-4571-92cb-ed3304f1b954	Thiết bị hội nghị	thiet-bi-hoi-nghi	8e694265-f3e2-4f13-b7d1-96aa89b089c1	\N	3	2026-07-10 14:29:48.15779+00
70b70043-8034-4aff-b323-ee855360236b	Máy in & Scan	may-in-scan	8e694265-f3e2-4f13-b7d1-96aa89b089c1	\N	4	2026-07-10 14:29:48.15779+00
37828ca7-1285-464a-9de3-2def774529bc	Máy tính	may-tinh	8e694265-f3e2-4f13-b7d1-96aa89b089c1	\N	1	2026-07-10 17:03:52.599464+00
9c899b28-9a6a-44d7-9a78-4468ea3a5a48	Bàn phím & Chuột	ban-phim-chuot	8e694265-f3e2-4f13-b7d1-96aa89b089c1	\N	5	2026-07-10 17:03:52.599464+00
9b79e54d-b36d-4556-a56c-5619a011da85	Phụ kiện kết nối	phu-kien-ket-noi	8e694265-f3e2-4f13-b7d1-96aa89b089c1	\N	6	2026-07-10 17:03:52.599464+00
2607a523-6d79-4509-8fe3-11ecf567005c	Laptop văn phòng	laptop-van-phong	37828ca7-1285-464a-9de3-2def774529bc	\N	1	2026-07-10 17:03:52.599464+00
970670ea-7060-4aec-a0f9-8bb37521c926	Máy tính để bàn	may-tinh-de-ban	37828ca7-1285-464a-9de3-2def774529bc	\N	2	2026-07-10 17:03:52.599464+00
75d4f8dc-988f-4825-98ec-eed55eba7028	Màn hình máy tính	man-hinh-may-tinh	37828ca7-1285-464a-9de3-2def774529bc	\N	3	2026-07-10 17:03:52.599464+00
f5eab77f-2719-474f-abd5-57899c04d49e	Máy in Laser	may-in-laser	70b70043-8034-4aff-b323-ee855360236b	\N	1	2026-07-10 17:03:52.599464+00
3c4e9e66-aa66-43fc-a4e3-4ce198aedf1d	Máy in Phun	may-in-phun	70b70043-8034-4aff-b323-ee855360236b	\N	2	2026-07-10 17:03:52.599464+00
5696daa2-0c47-470e-b8c0-a8ce65f97710	Máy in nhãn	may-in-nhan	70b70043-8034-4aff-b323-ee855360236b	\N	3	2026-07-10 17:03:52.599464+00
87a2b43f-4503-43bc-ace8-e0e5c6d76eb7	Máy scan tài liệu	may-scan-tai-lieu	70b70043-8034-4aff-b323-ee855360236b	\N	4	2026-07-10 17:03:52.599464+00
f77470b3-3e67-4113-bf98-b772b9a00c61	Bàn phím	ban-phim	9c899b28-9a6a-44d7-9a78-4468ea3a5a48	\N	1	2026-07-10 17:03:52.599464+00
54608f39-d4cc-46d2-bd2a-0e2a425d3157	Chuột	chuot-may-tinh	9c899b28-9a6a-44d7-9a78-4468ea3a5a48	\N	2	2026-07-10 17:03:52.599464+00
807bfbcd-0f46-43be-8a1c-014540c01aa6	Hub USB	hub-usb	9b79e54d-b36d-4556-a56c-5619a011da85	\N	1	2026-07-10 17:03:52.599464+00
3b9d3d3a-8fa5-42a3-978a-1a60953c5144	Docking Station	docking-station	9b79e54d-b36d-4556-a56c-5619a011da85	\N	2	2026-07-10 17:03:52.599464+00
b32a4ff7-fb62-434e-a198-535256aa68e6	Robot hoàn chỉnh	robot-hoan-chinh	7d66f013-4219-4f4e-aa97-da92ef23d788	\N	1	2026-07-11 12:36:18.916064+00
8932e94a-1428-4204-87b7-513e6e9f327e	Cánh tay & Kẹp gắp	canh-tay-kep-gap	7d66f013-4219-4f4e-aa97-da92ef23d788	\N	2	2026-07-11 12:36:18.916064+00
78f52bb2-de1d-4915-925d-b71a027f02f7	Servo & Động cơ	servo-dong-co	7d66f013-4219-4f4e-aa97-da92ef23d788	\N	3	2026-07-11 12:36:18.916064+00
b5407ab9-937b-4a58-826d-e583104a6ebe	NVIDIA	nvidia	11111111-1111-1111-1111-111111111111	\N	5	2026-07-13 09:41:00.374842+00
3b8242c3-6aaa-492f-baf3-90c37e65e2f0	NXP	nxp	11111111-1111-1111-1111-111111111111	\N	6	2026-07-13 09:41:00.374842+00
141cbb65-00b9-4b75-a5da-2781791d250d	FPGA	fpga	11111111-1111-1111-1111-111111111111	\N	7	2026-07-13 09:41:00.374842+00
92a9ecfb-6bdb-44a9-aff1-6458ef23e6a6	ePaper	epaper	3326e22d-68ad-4251-8370-50eab9e73bcb	\N	1	2026-07-31 17:57:07.277193+00
64310b96-0c11-4ec8-abe8-f7592c002004	AIoT & Hardware	aiot-hardware	\N	\N	0	2026-09-26 15:21:14.334069+00
\.


--
-- Data for Name: customer_addresses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.customer_addresses (id, customer_id, recipient_name, phone, address_line, city, is_default) FROM stdin;
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.customers (id, full_name, phone, created_at) FROM stdin;
2aaa04b4-40c3-403f-9e1a-d7c57ac92992	Nguyen Van Thanh	0352725245	2026-07-26 09:30:59.765557+00
\.


--
-- Data for Name: hero_banners; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.hero_banners (id, headline, subheadline, cta_label, cta_url, image_url, badge_text, display_order, is_active, created_at) FROM stdin;
34a47c70-1635-4f63-9296-6f650c540011	Linh kiện điện tử & Smart Home cho dân kỹ thuật	Logilab cung cấp module IoT, board mạch nhúng, cảm biến và thiết bị Smart Home chính hãng - đầy đủ datasheet, sẵn hàng, giao nhanh toàn quốc.	Mua ngay	/products	\N	Hàng mới về	0	t	2026-07-29 11:29:30.326779+00
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.order_items (id, order_id, variant_id, quantity, price) FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.orders (id, customer_id, status, total, shipping_address, phone, created_at) FROM stdin;
\.


--
-- Data for Name: product_images; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.product_images (id, product_id, image_url, display_order) FROM stdin;
05cb307c-81d6-483d-82c2-8514d6c02e5a	2c46b6e2-0f2c-4f10-b129-11e0fa678c98	https://cdn.shopify.com/s/files/1/0621/0050/4774/files/imgi_34_O1CN01n8z6RX1h9gMHzqbko__2201402014235.jpg?v=1782384387	0
3bc19458-4410-422e-8b23-df5041ef2e80	81ea7532-1977-4347-91c0-fdb07899d00b	https://cdn.shopify.com/s/files/1/0621/0050/4774/files/01-boardoza-vnh5019-enc-elite-main.jpg?v=1782461309	0
059f2581-11b8-4300-8af6-0eca78551e00	c73a3b72-8c13-4f7b-88ec-7fbf30fdc629	https://cdn.shopify.com/s/files/1/0621/0050/4774/files/waveshare-34981-gallery-01.webp?v=1783068114	0
9c7e343e-b83c-4f40-8581-6d20aaf1b87d	05ff2c97-874f-437e-a6f6-f822ea9cb6c5	https://cdn.shopify.com/s/files/1/0621/0050/4774/files/waveshare-34959-gallery-01.webp?v=1783065040	0
1cd49317-bdcf-449c-b903-efa89c4a6e20	186387e7-079a-42d9-96fc-e2fc50a321fa	https://cdn.shopify.com/s/files/1/0621/0050/4774/files/waveshare-34781-gallery-01.webp?v=1783063647	0
b66f030b-6ae6-4ba2-be3b-a33dd907e1ca	5e1bcf72-5340-48c7-9f5d-0aa9d524f71f	https://cdn.shopify.com/s/files/1/0621/0050/4774/files/orangepi-5pro-1-20260709b.webp?v=1783562773	0
5ff5033a-be1a-4c5e-9538-d30100deada4	c89dfc08-aa0f-4b94-b5b6-009654bf8818	https://cdn.shopify.com/s/files/1/0621/0050/4774/files/image-01-700_789ac05d-e4f1-49fa-b33d-c091c8e69034.webp?v=1782698348	0
6a1f2677-88f6-41ab-be0f-bf50b59ccd1e	28fa3a2f-0bc6-4002-b614-89d53ceef51c	https://cdn.shopify.com/s/files/1/0621/0050/4774/files/Adafruit-3333-05-1200_20321391-5518-4524-974f-01f9e1e34a53.webp?v=1781321845	0
e3478392-c048-49ea-8c68-849678a333aa	75b98b0e-c7e7-490d-8408-ef608e221f75	https://cdn.shopify.com/s/files/1/0621/0050/4774/files/Adafruit-4000-01-1200_45776411-08e8-4ce8-b963-f85c7d785319.webp?v=1781321781	0
12b21995-6bb8-42d5-b6ea-6200179846f6	8ea34135-2601-4d4f-b46d-4c94fdc1b284	https://cdn.shopify.com/s/files/1/0621/0050/4774/files/lilygo-k279-01.webp?v=1783046121	0
d57e4b40-4d65-4bdc-950f-191c951d737e	d84811db-dee4-46e9-aeb3-5a9df7cc466e	https://cdn.shopify.com/s/files/1/0621/0050/4774/files/bbv10000034-01-real.jpg?v=1782094039	0
c7658603-d3f8-4c70-a690-f89337152ea7	16535157-f3f5-40f8-b193-78791fe1e60f	https://cdn.shopify.com/s/files/1/0621/0050/4774/files/bbv10000031-01-real.jpg?v=1781768265	0
38dae3f2-8937-4358-a0df-0ecdf1bd0490	8406dc6b-145e-46e7-a5d2-44fae50f8c03	https://cdn.shopify.com/s/files/1/0621/0050/4774/files/waveshare-25482-product-01-20260710a.webp?v=1783678482	0
2c9b6572-036b-4e3f-9d48-d0fcccdbc401	5aa8071f-47d3-4893-89c0-46937806ff19	https://cdn.shopify.com/s/files/1/0621/0050/4774/files/01-boardoza-ams1117-5v-regulator-angled.webp?v=1783494748	0
584b13b3-0c73-4260-967d-a95d3cc93878	bd5f943c-e66b-4c7c-8444-323b17a6eae8	https://cdn.shopify.com/s/files/1/0621/0050/4774/files/waveshare-imx378-fisheye-gallery-01.webp?v=1783391391	0
c0b519a1-a4f9-4fad-aaa0-58fe4d9c5071	946514cb-f546-4b17-9331-1240e2d5a219	https://cdn.shopify.com/s/files/1/0621/0050/4774/files/waveshare-ov4689-usb-camera-gallery-01.webp?v=1783390499	0
d3c7365b-c30e-4020-bafe-606e20b6a9b5	e8771442-e98b-4403-8e46-d19c2d6b7e58	https://cdn.shopify.com/s/files/1/0621/0050/4774/files/elecrow-lml15607d-01.jpg?v=1781237549	0
76121374-872f-45b6-bc59-ff8b6df49d10	e9774e8a-a645-4688-8122-7d03999c92a9	https://cdn.shopify.com/s/files/1/0621/0050/4774/files/01-elecrow-thinknode-m4-lorawan-tracker-main.webp?v=1781071298	0
bfb3ba23-08d2-420a-94b0-17a7f351090f	8393992b-e09b-4ab4-a2fa-360c4f2cb987	https://cdn.shopify.com/s/files/1/0621/0050/4774/files/01_standard_1000.jpg?v=1782123123	0
c0d773d4-d365-4b24-9139-41bb497e0214	85f4fb59-c8e7-4ffa-94a5-dffda17da975	https://cdn.shopify.com/s/files/1/0621/0050/4774/files/RMD-X8-P20-120-E-1.jpg?v=1780576396	0
ad93ffbb-cb35-4884-9def-183e34878d0e	742ae0ab-496c-4702-bccd-581ffee02ac5	https://cdn.shopify.com/s/files/1/0621/0050/4774/files/01-seeed-100036262-image-1782914091146.jpg?v=1782914095	0
f89b3ca1-e2e7-470f-9475-6810d90bed99	af5e1410-fa3b-482d-a11d-5db2bcd040bb	https://cdn.shopify.com/s/files/1/0621/0050/4774/files/O1CN01uXi3au2IO0bF8FpIQ__138009275_jpg_q50_jpg.webp?v=1782716041	0
bc1fea58-e921-4bf4-a35e-855d585cc5ca	b2d6352a-617e-4ee0-8a1d-ff06b001abf7	https://cdn.shopify.com/s/files/1/0621/0050/4774/files/O1CN01i73j181wRkKATQjjB__2658366305_png_q50_jpg.webp?v=1781868759	0
06d772c3-e0ac-4689-925c-98a33a08bb83	6bd8fa55-d8f6-47be-91a0-7b67d4bc2ba6	https://cdn.shopify.com/s/files/1/0621/0050/4774/files/O1CN0163W7hc1syU0av26UW__931755835_png.webp?v=1781515478	0
4cf0f021-10e2-4c29-a287-a4ff8cdc5365	639d20d7-7930-4b7b-b69e-b644a719ef50	https://cdn.shopify.com/s/files/1/0621/0050/4774/files/O1CN01lTpBFZ1U4YxVNOiVJ__206122464_png_q50_jpg.webp?v=1781870989	0
5d42368e-23f0-4118-87a7-0b879cd756e7	dc6305d8-63b1-44d7-8b27-5efb55bdad1f	https://cdn.shopify.com/s/files/1/0621/0050/4774/files/MAD-5010-EEE-110KV-1.jpg?v=1780898467	0
3eb5bfef-871a-4c49-86e6-2e5db886b118	cc1e52c6-86db-4769-bc48-ecbf950fa4e8	https://cdn.shopify.com/s/files/1/0621/0050/4774/files/O1CN01OnQhsc2IO0bQlVp87__138009275_jpg_q50_jpg.webp?v=1782718509	0
cef746f2-f273-466b-9e94-9a181897ca13	c96f7652-ed90-4379-96e5-f5d58ae1c3c9	https://cdn.shopify.com/s/files/1/0621/0050/4774/files/waveshare-146-touch-lcd-gallery-01.webp?v=1783389180	0
f1411638-e62f-43f0-813f-84bc9401b6d2	71bcd8a8-0b68-4a8b-a08f-83c2304db557	https://cdn.shopify.com/s/files/1/0621/0050/4774/files/waveshare-35000-gallery-01.webp?v=1783322970	0
3b9dbbd3-22e5-49ac-ac9a-2f60f4f48b30	e1f26e35-2a2d-4d80-a089-b6d6b6f18c2a	https://cdn.shopify.com/s/files/1/0621/0050/4774/files/waveshare-35045-gallery-01.webp?v=1783319422	0
41af6a61-4e9f-4b61-81eb-d3f20b0b7bba	520d87a1-ee2d-4238-b652-f46b067ebbed	https://cdn.shopify.com/s/files/1/0621/0050/4774/files/waveshare-34986-gallery-01.webp?v=1783065907	0
bfd0b1e9-4b1b-44b6-ab88-11e761a4b47d	1470cee8-6c2f-415c-b469-b38de8191a94	https://cdn.shopify.com/s/files/1/0621/0050/4774/files/image-01-700_0b260e5d-8a1b-42be-ac11-8cfb835d16bf.webp?v=1782200814	0
69ccd976-e9b8-4db3-84a2-82ecfb594ef0	daf40a3e-f35d-4a45-a1b8-8ae690d65ea1	https://cdn.shopify.com/s/files/1/0621/0050/4774/files/01_0990e18a-f9f1-4e2e-bcbf-b5c0abbfe2d6.webp?v=1781683074	0
a55884de-db9a-4be1-8db2-6327a41000e1	466a989d-f405-4a25-9651-810a4b933b4c	https://cdn.shopify.com/s/files/1/0621/0050/4774/files/waveshare-jetson-orin-case-b-gallery-01.webp?v=1783392478	0
22cfe8c7-6c55-42a0-8c15-42837ed1ba87	b60b2a9e-d5da-4c8b-b31f-cc7ce0922198	https://cdn.shopify.com/s/files/1/0621/0050/4774/files/waveshare-34932-gallery-01.webp?v=1783328120	0
dc14157b-3500-4206-bab5-b81c107d4813	70f1668a-f91c-4f21-89be-0a662d1c3e6a	https://cdn.shopify.com/s/files/1/0621/0050/4774/files/seeed-100033211-1-20260708b.webp?v=1783481221	0
a03430a1-f8d0-4929-bd3a-f92537b7467b	073b828f-78c1-411d-82d1-48c6a5fabeb7	https://cdn.shopify.com/s/files/1/0621/0050/4774/files/01-boardoza-phoenix24-front.webp?v=1783565038	0
62ef7db7-2350-41f7-a1ad-891de72ba45e	c6da69a9-d951-4027-b795-93ebb02073da	https://cdn.shopify.com/s/files/1/0621/0050/4774/files/01-boardoza-phoenix12-angled.webp?v=1783564257	0
5068f3b6-e9b6-4470-8561-8cdf514e630e	ec2d9ae6-fb1b-49c9-98ac-ea64333480cb	https://cdn.shopify.com/s/files/1/0621/0050/4774/files/lilygo-h812-01.webp?v=1783046695	0
448a6425-bdb4-4e0c-ae23-860534596341	b3bcbb51-8efb-4529-a701-46776f60325c	https://www.hiwonder.com/cdn/shop/files/JetAuto_Pro_fd08275d-6948-4f51-9fc0-c024342bdf5c.png?v=1782201953	0
5f9a7b16-ace9-4d92-952e-3e488c63da55	ba6df3e1-282a-4f62-a1d1-66fa892105ef	https://www.hiwonder.com/cdn/shop/files/TonyPi_Pro.png?v=1782203360	0
29ecd347-b695-4018-8643-05bcf58ded89	8035e06a-3494-473d-a7e1-dd42cfea2ce6	https://www.hiwonder.com/cdn/shop/files/PuppyPi_d08fa7b5-6449-4b27-a352-f1b15dd55c2f.png?v=1782202933	0
9707d259-712c-4c60-96b3-e576bdfa1087	168ee732-ece3-429a-9a9a-f45093a2e1e9	https://www.hiwonder.com/cdn/shop/files/MentorPi_Ti.png?v=1782202684	0
541f0d88-6666-4d79-ba25-da4535c1de08	8010f6c8-7eba-43c8-a43a-e91163b3ee4d	https://www.hiwonder.com/cdn/shop/files/c645dcb484ade591b87c265f355e76e9.png?v=1782203765	0
2781697b-87b7-4bf6-8e1b-a0361b96450a	ebb1c988-17b5-47ee-bed3-dd3caa2071ae	https://www.hiwonder.com/cdn/shop/files/5cd8d219e34e10bb9289031783d8d8d1_720.png?v=1782203804	0
f3562339-f429-497c-af82-e978bbda42dd	cf0d4a50-8576-48bd-bba2-01b199eb8779	https://picsum.photos/seed/stmicroelectronics-small-module-v5-0NHe/600/400	0
e3724f1b-4628-429a-902f-2aa388d961fe	fd8c393d-79f0-489f-8925-b699de8eef4d	https://picsum.photos/seed/raspberry-pi-licensed-module-v1-1Rsu/600/400	0
9bfecde4-be30-433c-86e2-dc3028df5d52	3fff393a-ca1d-41bd-b909-2bf3400ee0a2	https://picsum.photos/seed/nvidia-fantastic-module-v1-tUA2/600/400	0
830ec8ad-854d-42ed-bfff-f022b3a22701	65f8a183-63f7-4cf3-89b5-604e625c0615	https://picsum.photos/seed/sensirion-oriental-module-v3-sqWT/600/400	0
ad7ac7d2-eddb-4d4b-be2e-f5e662008a19	614e6cd1-a790-4c2b-8914-f859f809ef29	https://picsum.photos/seed/stmicroelectronics-intelligent-module-v3-3Vre/600/400	0
301240a6-e91e-43c3-b42e-b78f12d095f6	bfb11b53-6ab2-4422-ba6a-914c3c5bcf10	https://picsum.photos/seed/sensirion-gorgeous-module-v2-02Gn/600/400	0
7dd54630-33db-4291-b358-32d3cb4d97e1	4ece8cf5-5eee-4d16-97a5-96156103d0d4	https://picsum.photos/seed/nvidia-handmade-module-v5-fczR/600/400	0
cb1f5c5b-df29-4fd9-abad-bb826fdbc8ac	b094b4a7-3496-42ce-9f10-ffe99084d86b	https://picsum.photos/seed/sensirion-tasty-module-v2-LkbS/600/400	0
c0af8f11-5ef2-4a73-975a-f263804f759b	b3da4816-04ee-4733-af1d-a8777afa4344	https://picsum.photos/seed/seeed-studio-intelligent-module-v2-frgE/600/400	0
a22ab6c4-899c-42c0-86c6-408503e42859	ffe4b1dd-26c3-459e-ba92-0bbdbe5f0d89	https://picsum.photos/seed/nvidia-handmade-module-v2-nL1d/600/400	0
c331eea6-b482-4da1-a412-19853310f7c8	bc986bfa-1bd4-4232-8659-d9d089ba3490	https://picsum.photos/seed/espressif-soft-module-v2-M7Eb/600/400	0
3c37f315-27f7-48e7-8c9d-488ea2830af6	193436db-d64d-4b00-936b-c9894b22caf1	https://picsum.photos/seed/sensirion-small-module-v4-f9Ug/600/400	0
421d93c4-9971-4e09-b941-bc8662c66506	f0bb03c2-af0f-4580-b763-cf5228f5e097	https://picsum.photos/seed/stmicroelectronics-recycled-module-v3-Hpfr/600/400	0
da1bcd9a-aff9-413d-989b-d5bc4b780c61	280153c7-fe5a-452c-a79b-005f9e5bc839	https://picsum.photos/seed/raspberry-pi-handmade-module-v5-xb2O/600/400	0
ee1d724f-b21b-4a8e-82ec-9d408c0fce2c	3ebaf38a-2d61-47c6-8921-bbef2a194c03	https://picsum.photos/seed/stmicroelectronics-handmade-module-v5-uNuC/600/400	0
86f62612-3491-4138-8354-14e0723f5df5	599446fa-e579-4e3c-8194-604bd6ced0e0	https://picsum.photos/seed/sensirion-rustic-module-v2-OGVs/600/400	0
e9a98019-9c89-4bca-a735-4df05a433fe5	501da833-f82b-415f-86b0-d59dbcb41a21	https://picsum.photos/seed/nvidia-rustic-module-v3-63H8/600/400	0
ba39d39b-2948-4438-a783-02396a46377b	167f1da2-5a0a-4b17-91e2-80fbf4cc72eb	https://picsum.photos/seed/stmicroelectronics-soft-module-v4-xS3x/600/400	0
07904cbf-c5de-4827-9651-36d3f3535078	56cf4d21-33d7-4ea8-9e20-8cd6c68e3249	https://picsum.photos/seed/stmicroelectronics-small-module-v4-iNto/600/400	0
7c412327-3c2d-462c-b925-67c52eae1867	0e5b66c0-71ec-462a-984e-e84b85998bf0	https://picsum.photos/seed/raspberry-pi-generic-module-v5-uQwm/600/400	0
\.


--
-- Data for Name: product_variants; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.product_variants (id, product_id, variant_name, sku, price, stock, created_at) FROM stdin;
caeeafdb-70d6-4867-921b-bcb5b560801c	c73a3b72-8c13-4f7b-88ec-7fbf30fdc629	Bản tiêu chuẩn	Waveshare-34981	177000.00	45	2026-07-11 12:36:18.916064+00
019e084c-f7c1-415d-b4eb-b2995b53a81a	05ff2c97-874f-437e-a6f6-f822ea9cb6c5	Bản tiêu chuẩn	Waveshare-34959	162000.00	12	2026-07-11 12:36:18.916064+00
17e64bf3-44c6-4468-8bf9-e84ff70a8c33	186387e7-079a-42d9-96fc-e2fc50a321fa	Bản tiêu chuẩn	Waveshare-34781	593000.00	6	2026-07-11 12:36:18.916064+00
139fc778-2086-4722-8c56-34271b2cb9ab	5e1bcf72-5340-48c7-9f5d-0aa9d524f71f	Bản tiêu chuẩn	OrangePi-5Pro-4G	5613000.00	52	2026-07-11 12:36:18.916064+00
422b4b78-dd2f-4ace-8c07-c08b716ec3b8	c89dfc08-aa0f-4b94-b5b6-009654bf8818	Bản tiêu chuẩn	Waveshare-30446	6592000.00	22	2026-07-11 12:36:18.916064+00
2e2d7434-1080-43c3-8107-1bf71d468a3a	28fa3a2f-0bc6-4002-b614-89d53ceef51c	Bản tiêu chuẩn	Adafruit-3333	1008000.00	20	2026-07-11 12:36:18.916064+00
9b07eeea-6bd4-4f58-bfb1-14fdff446ebe	8ea34135-2601-4d4f-b46d-4c94fdc1b284	Bản tiêu chuẩn	LILYGO-K279	2850000.00	13	2026-07-11 12:36:18.916064+00
0259f925-8008-4cbf-8bde-f773dd75a793	d84811db-dee4-46e9-aeb3-5a9df7cc466e	Bản tiêu chuẩn	Boardoza-BBV10000034	208000.00	52	2026-07-11 12:36:18.916064+00
9ec3a537-b47a-4f46-97a8-3a9a829f5015	16535157-f3f5-40f8-b193-78791fe1e60f	Bản tiêu chuẩn	Boardoza-BBV10000031	1040000.00	11	2026-07-11 12:36:18.916064+00
f4d80eef-b7f8-4f87-8d0e-3ce9f9a1af88	8406dc6b-145e-46e7-a5d2-44fae50f8c03	Bản tiêu chuẩn	Waveshare-25482	1721000.00	48	2026-07-11 12:36:18.916064+00
7c62f800-9c20-4e52-b63e-c8fcd88cda69	5aa8071f-47d3-4893-89c0-46937806ff19	Bản tiêu chuẩn	Boardoza-BM2V10000005	78000.00	52	2026-07-11 12:36:18.916064+00
38ff700e-d36c-493b-8315-a426464fe2f9	bd5f943c-e66b-4c7c-8444-323b17a6eae8	Bản tiêu chuẩn	Waveshare-34709	1335000.00	39	2026-07-11 12:36:18.916064+00
204dd00f-3f7e-40c8-8cac-b485024870d1	946514cb-f546-4b17-9331-1240e2d5a219	Bản tiêu chuẩn	Waveshare-34767	563000.00	10	2026-07-11 12:36:18.916064+00
3d749ed2-79c2-4519-abfe-06b358505271	e8771442-e98b-4403-8e46-d19c2d6b7e58	Bản tiêu chuẩn	ELECROW-LML15607D	1632000.00	42	2026-07-11 12:36:18.916064+00
04e04211-febc-4709-bf87-55c4dabeb6df	e9774e8a-a645-4688-8122-7d03999c92a9	Bản tiêu chuẩn	ELECROW-LMM14004D2	1870000.00	32	2026-07-11 12:36:18.916064+00
f6787a27-ba33-42af-bad5-106d571f03e7	b3bcbb51-8efb-4529-a701-46776f60325c	Bản tiêu chuẩn	Hiwonder-21030806	57973000.00	7	2026-07-11 12:36:18.916064+00
f9375569-b2b8-4f6e-a13a-20ec80e7e5ba	ba6df3e1-282a-4f62-a1d1-66fa892105ef	Bản tiêu chuẩn	Hiwonder-21020135	37094000.00	6	2026-07-11 12:36:18.916064+00
b4b927a7-a0aa-44e5-adc5-ae49b90009cd	8035e06a-3494-473d-a7e1-dd42cfea2ce6	Bản tiêu chuẩn	Hiwonder-21040148	37332000.00	10	2026-07-11 12:36:18.916064+00
e7281df2-7d44-44f9-9a0a-435bfaf1fe45	168ee732-ece3-429a-9a9a-f45093a2e1e9	Bản tiêu chuẩn	Hiwonder-21030952	23343000.00	18	2026-07-11 12:36:18.916064+00
be99eda5-435c-493d-b2c8-21c34be3886e	8010f6c8-7eba-43c8-a43a-e91163b3ee4d	Bản tiêu chuẩn	Hiwonder-21010143	13839000.00	19	2026-07-11 12:36:18.916064+00
b73ccee6-a000-4895-90cf-b0cee02a0a4a	ebb1c988-17b5-47ee-bed3-dd3caa2071ae	Bản tiêu chuẩn	Hiwonder-21010183	10037000.00	37	2026-07-11 12:36:18.916064+00
edb86c1f-4423-420b-8ec7-b59770b9b9bf	8393992b-e09b-4ab4-a2fa-360c4f2cb987	Bản tiêu chuẩn	Unitree-Dex1-1S	19898000.00	43	2026-07-11 12:36:18.916064+00
58a0e598-4bd8-4328-8d4c-c37bdc75fb30	85f4fb59-c8e7-4ffa-94a5-dffda17da975	Bản tiêu chuẩn	RMD-X8-P20-120-E	16631000.00	6	2026-07-11 12:36:18.916064+00
06a60263-7320-4b60-ae97-6bb77d6f05ce	2c46b6e2-0f2c-4f10-b129-11e0fa678c98	Bản tiêu chuẩn	Feetech-HLS3612-C001	1781000.00	40	2026-07-11 12:36:18.916064+00
f60b4006-f58e-4279-be58-ea5594110a84	81ea7532-1977-4347-91c0-fdb07899d00b	Bản tiêu chuẩn	Boardoza-B0601V10000184	780000.00	17	2026-07-11 12:36:18.916064+00
c37bb821-7b45-405d-a741-c7630952e666	742ae0ab-496c-4702-bccd-581ffee02ac5	Bản tiêu chuẩn	Seeed-100036262	7424000.00	50	2026-07-11 12:36:18.916064+00
6ded5656-ab45-4f2c-9c77-bf289325cec7	af5e1410-fa3b-482d-a11d-5db2bcd040bb	Bản tiêu chuẩn	TB-MH743-SLIMV3-NCS-BI	2657000.00	46	2026-07-11 12:36:18.916064+00
1bc4d09e-1a89-40cb-ac96-5dc2ace8ab99	b2d6352a-617e-4ee0-8a1d-ff06b001abf7	Bản tiêu chuẩn	TB-XL106	4038000.00	49	2026-07-11 12:36:18.916064+00
0e4ae5c1-ea06-430b-b410-559773cb7d37	6bd8fa55-d8f6-47be-91a0-7b67d4bc2ba6	Bản tiêu chuẩn	Holybro-X650-FK	8909000.00	39	2026-07-11 12:36:18.916064+00
8f968054-d684-427d-8ee1-433d800987a3	639d20d7-7930-4b7b-b69e-b644a719ef50	Bản tiêu chuẩn	TB-V3115-900KV	1721000.00	31	2026-07-11 12:36:18.916064+00
8ef448dd-572e-48af-a51b-23d679e6b61a	dc6305d8-63b1-44d7-8b27-5efb55bdad1f	Bản tiêu chuẩn	MAD-5010-EEE-110KV	2969000.00	19	2026-07-11 12:36:18.916064+00
5d3fe13f-18ab-46b6-9991-ed5a51626013	cc1e52c6-86db-4769-bc48-ecbf950fa4e8	Bản tiêu chuẩn	TB-M10Q5883	1692000.00	33	2026-07-11 12:36:18.916064+00
28c9eff4-2374-4edf-9a6e-403e646084a4	c96f7652-ed90-4379-96e5-f5d58ae1c3c9	Bản tiêu chuẩn	Waveshare-34955	444000.00	42	2026-07-11 12:36:18.916064+00
8f6fb4a5-98e0-434a-abf2-432f23790b80	71bcd8a8-0b68-4a8b-a08f-83c2304db557	Bản tiêu chuẩn	Waveshare-35000	2226000.00	22	2026-07-11 12:36:18.916064+00
f9eaa591-6a7c-44aa-834d-ed71a41317f1	e1f26e35-2a2d-4d80-a089-b6d6b6f18c2a	Bản tiêu chuẩn	Waveshare-35045	4425000.00	56	2026-07-11 12:36:18.916064+00
56a29ed4-3d85-4429-a5f3-067589e216f6	1470cee8-6c2f-415c-b469-b38de8191a94	Bản tiêu chuẩn	GooDisplay-GDEY0266F51	325000.00	5	2026-07-11 12:36:18.916064+00
10f3a43a-19da-4b9b-86ad-8ef23b256382	daf40a3e-f35d-4a45-a1b8-8ae690d65ea1	Bản tiêu chuẩn	ELECROW-CRV12214D-EN	5045000.00	53	2026-07-11 12:36:18.916064+00
aead1323-7fa3-491f-81da-45456509bc9b	466a989d-f405-4a25-9651-810a4b933b4c	Bản tiêu chuẩn	Waveshare-34998	414000.00	56	2026-07-11 12:36:18.916064+00
5b3ddccf-d33f-45e5-a5d8-ffc029986a73	b60b2a9e-d5da-4c8b-b31f-cc7ce0922198	Bản tiêu chuẩn	Waveshare-34932	890000.00	15	2026-07-11 12:36:18.916064+00
112e57b9-e256-45da-bc96-947ddf75c0fc	70f1668a-f91c-4f21-89be-0a662d1c3e6a	Bản tiêu chuẩn	Seeed-100033211	444000.00	49	2026-07-11 12:36:18.916064+00
62cebf0d-c0d5-4cc4-a048-e97e93fd5d3a	073b828f-78c1-411d-82d1-48c6a5fabeb7	Bản tiêu chuẩn	Boardoza-B0501V10000108	312000.00	32	2026-07-11 12:36:18.916064+00
0010e257-c9a3-44ed-9888-49b76087e5cf	c6da69a9-d951-4027-b795-93ebb02073da	Bản tiêu chuẩn	Boardoza-B0501V10000106	156000.00	26	2026-07-11 12:36:18.916064+00
43504161-114d-4d0e-9a9f-de48fc18c279	ec2d9ae6-fb1b-49c9-98ac-ea64333480cb	Bản tiêu chuẩn	LILYGO-H812	352000.00	22	2026-07-11 12:36:18.916064+00
39234881-b719-40ff-a595-5a8289b0ad3c	520d87a1-ee2d-4238-b652-f46b067ebbed	Bản tiêu chuẩn	Waveshare-34986	9474000.00	58	2026-07-11 12:36:18.916064+00
84c41c86-225b-4681-9007-82cdcae33e0c	75b98b0e-c7e7-490d-8408-ef608e221f75	Bản tiêu chuẩn	Adafruit-4000	1424000.00	17	2026-07-11 12:36:18.916064+00
55f1b93d-14b3-4b54-8ffd-fa5f1f765b14	cf0d4a50-8576-48bd-bba2-01b199eb8779	Standard Edition	\N	100.04	129	2026-09-26 15:21:14.349737+00
d8bf6ad7-7bd7-42a3-8eb6-e3d9dabba300	fd8c393d-79f0-489f-8925-b699de8eef4d	Standard Edition	\N	250.25	130	2026-09-26 15:21:14.35463+00
74edef73-dc7f-43d9-9eaf-c56bc9f14796	3fff393a-ca1d-41bd-b909-2bf3400ee0a2	Standard Edition	\N	289.89	120	2026-09-26 15:21:14.357635+00
53091e62-1944-4c11-bd71-8202a22f8bbe	65f8a183-63f7-4cf3-89b5-604e625c0615	Standard Edition	\N	142.49	50	2026-09-26 15:21:14.359689+00
14f6e4c0-dbe9-46d2-bacc-e64b811d0217	614e6cd1-a790-4c2b-8914-f859f809ef29	Standard Edition	\N	128.79	128	2026-09-26 15:21:14.361568+00
41a10013-8001-4db8-a47d-082bd324272c	bfb11b53-6ab2-4422-ba6a-914c3c5bcf10	Standard Edition	\N	138.65	178	2026-09-26 15:21:14.362988+00
2654f728-be02-4fef-80d3-03aefe5077c1	4ece8cf5-5eee-4d16-97a5-96156103d0d4	Standard Edition	\N	8.09	13	2026-09-26 15:21:14.364438+00
78cda172-d11f-429b-92cf-7a958edc54ff	b094b4a7-3496-42ce-9f10-ffe99084d86b	Standard Edition	\N	147.90	178	2026-09-26 15:21:14.365874+00
3d0d0812-78c7-424f-b4b6-0c62635356c0	b3da4816-04ee-4733-af1d-a8777afa4344	Standard Edition	\N	226.75	186	2026-09-26 15:21:14.367427+00
015d59f4-a752-4a5f-98e4-0ee227d16e1c	ffe4b1dd-26c3-459e-ba92-0bbdbe5f0d89	Standard Edition	\N	93.85	28	2026-09-26 15:21:14.368668+00
eb7ab968-6f79-420a-9210-1893b0353fa9	bc986bfa-1bd4-4232-8659-d9d089ba3490	Standard Edition	\N	133.09	145	2026-09-26 15:21:14.370135+00
e31cdd3d-2398-4b1d-98e8-a9c951f4c9e9	193436db-d64d-4b00-936b-c9894b22caf1	Standard Edition	\N	192.15	160	2026-09-26 15:21:14.371713+00
03762b79-da73-4fad-935e-ad562d7fc7da	f0bb03c2-af0f-4580-b763-cf5228f5e097	Standard Edition	\N	203.99	90	2026-09-26 15:21:14.373261+00
df8b5e95-40c1-4e3f-9610-3ef6c2699f46	280153c7-fe5a-452c-a79b-005f9e5bc839	Standard Edition	\N	204.49	118	2026-09-26 15:21:14.374713+00
6e81dd6d-d593-44eb-904e-0ba9ccae47d6	3ebaf38a-2d61-47c6-8921-bbef2a194c03	Standard Edition	\N	290.45	101	2026-09-26 15:21:14.37595+00
0312b1c7-41e1-400a-9e14-6cbad2470ddb	599446fa-e579-4e3c-8194-604bd6ced0e0	Standard Edition	\N	229.49	44	2026-09-26 15:21:14.377175+00
4f5e552d-ae4f-481d-8453-1cf56d7d18fa	501da833-f82b-415f-86b0-d59dbcb41a21	Standard Edition	\N	63.75	156	2026-09-26 15:21:14.378453+00
3eab2cf0-2941-4a07-a870-5f8dc13939d1	167f1da2-5a0a-4b17-91e2-80fbf4cc72eb	Standard Edition	\N	74.39	41	2026-09-26 15:21:14.379761+00
1171082a-dd9a-46d5-a101-9ebed719fbd3	56cf4d21-33d7-4ea8-9e20-8cd6c68e3249	Standard Edition	\N	195.79	198	2026-09-26 15:21:14.380991+00
5fd3d63d-7701-4e9c-92df-01bbb1c4ec78	0e5b66c0-71ec-462a-984e-e84b85998bf0	Standard Edition	\N	64.99	71	2026-09-26 15:21:14.382277+00
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.products (id, name, slug, description, category_id, created_at, specs, datasheet_url, library_url, brand) FROM stdin;
8393992b-e09b-4ab4-a2fa-360c4f2cb987	Unitree Dex1-1 High-Precision Robotic Hand with Adaptive Grasping Design	unitree-dex1-1-high-precision-robotic-hand-with-adaptive-grasping-design-pre-sal	Unitree Dex1-1 is a compact high-precision robotic hand built as a parallel two-finger gripper for humanoid robot grasping, teleoperation, embodied-AI data collection, and manipulation research. It uses a single Unitree…	8932e94a-1428-4204-87b7-513e6e9f327e	2026-07-11 12:36:18.916064+00	[{"label": "Thương hiệu", "value": "Unitree"}, {"label": "SKU", "value": "Unitree-Dex1-1S"}]	\N	\N	\N
75b98b0e-c7e7-490d-8408-ef608e221f75	Adafruit Metro M4 Express AirLift (WiFi) - Lite	adafruit-metro-m4-express-airlift-wifi-lite	Give your next project a lift with AirLift - our witty name for the ESP32 co-processor that graces this Metro M4. You already know about the Adafruit Metro M4 featuring the Microchip ATSAMD51 , with it's 120MHz Cortex…	f7fa2bc8-0760-4de6-959e-5644aa29e711	2026-07-11 12:36:18.916064+00	[{"label": "Thương hiệu", "value": "Adafruit"}, {"label": "SKU", "value": "Adafruit-4000"}]	https://learn.adafruit.com/adafruit-metro-m4-express-airlift-wifi/overview	https://github.com/adafruit/WiFiNINA/	Adafruit
c73a3b72-8c13-4f7b-88ec-7fbf30fdc629	Waveshare ESP32-C6-Zero-B Mini Wi-Fi 6 Development Board Without Header	waveshare-esp32-c6-zero-b-mini-wi-fi-6-development-board-without-header	Description The Waveshare ESP32-C6-Zero-B Mini Wi-Fi 6 Development Board is a compact Type B ESP32-C6 board based on the ESP32-C6FH8 . It supports a 5-36V wide-voltage power input , Wi-Fi 6, Bluetooth 5, and IEEE…	dd8a29c3-94d4-42cc-803a-dbd5d09ba482	2026-07-11 12:36:18.916064+00	[{"label": "Thương hiệu", "value": "Waveshare"}, {"label": "SKU", "value": "Waveshare-34981"}]	https://docs.waveshare.com/ESP32-C6-Zero-B	\N	Waveshare
186387e7-079a-42d9-96fc-e2fc50a321fa	Waveshare Industrial ESP32-S3 Control Board With RS485 And CAN	waveshare-industrial-esp32-s3-control-board-with-rs485-and-can	Description The Waveshare Industrial ESP32-S3 Control Board with RS485 and CAN is an industrial controller based on the ESP32-S3 dual-core MCU. It combines Wi-Fi , Bluetooth 5 LE , isolated RS485 , isolated CAN , a wide…	dd8a29c3-94d4-42cc-803a-dbd5d09ba482	2026-07-11 12:36:18.916064+00	[{"label": "Thương hiệu", "value": "Waveshare"}, {"label": "SKU", "value": "Waveshare-34781"}]	https://www.waveshare.com/wiki/ESP32-S3-RS485-CAN	\N	Waveshare
c89dfc08-aa0f-4b94-b5b6-009654bf8818	Waveshare Raspberry Pi Compute Module 5 4GB RAM 16GB eMMC without WiFi	waveshare-raspberry-pi-compute-module-5-4gb-ram-16gb-emmc-without-wifi	Waveshare Raspberry Pi Compute Module 5 4GB RAM 16GB eMMC without WiFi is a compact system-on-module based on Raspberry Pi Compute Module 5 hardware. Based on the official Waveshare Compute Module 5 family page and the…	ed3c7c1a-8972-4bd0-bc93-1de53715d674	2026-07-11 12:36:18.916064+00	[{"label": "Thương hiệu", "value": "Waveshare"}, {"label": "SKU", "value": "Waveshare-30446"}]	https://docs.waveshare.com/Compute-Module-5	\N	Waveshare
05ff2c97-874f-437e-a6f6-f822ea9cb6c5	Waveshare RP2350-Zero-CM Mini Development Board	waveshare-rp2350-zero-cm-mini-development-board	Description The Waveshare RP2350-Zero-CM Mini Development Board is a compact castellated module based on the Raspberry Pi RP2350A microcontroller. It brings all GPIOs and an onboard USB Type-C male port into a tiny…	ed3c7c1a-8972-4bd0-bc93-1de53715d674	2026-07-11 12:36:18.916064+00	[{"label": "Thương hiệu", "value": "Waveshare"}, {"label": "SKU", "value": "Waveshare-34959"}]	https://files.waveshare.com/wiki/common/Rp2350-datasheet.pdf	https://www.waveshare.com/wiki/RP2350-Zero	Waveshare
946514cb-f546-4b17-9331-1240e2d5a219	Waveshare OV4689 4MP USB Camera Type A 92 Degree FOV	waveshare-ov4689-4mp-usb-camera-type-a-92-degree-fov	Description The Waveshare OV4689 4MP USB Camera (A) is a compact USB camera module built around the OV4689 sensor . It provides 4MP image capture , a 92 degree distortion-free field of view , USB 2.0 Type-C…	3b540004-b6f6-4597-9190-fd4fcdaf41ab	2026-07-11 12:36:18.916064+00	[{"label": "Thương hiệu", "value": "Waveshare"}, {"label": "SKU", "value": "Waveshare-34767"}]	\N	\N	\N
e8771442-e98b-4403-8e46-d19c2d6b7e58	Elecrow ThinkNode M7 LoRaWAN Wireless Communication Gateway	elecrow-thinknode-m7-lorawan-wireless-communication-gateway	Description Elecrow ThinkNode M7 LoRaWAN Wireless Communication Gateway is an indoor LoRaWAN gateway built around the ESP32-S3 module and LR1110 LoRa chip. It is designed for LoRaWAN deployments that need stable indoor…	3b540004-b6f6-4597-9190-fd4fcdaf41ab	2026-07-11 12:36:18.916064+00	[{"label": "Thương hiệu", "value": "Elecrow"}, {"label": "SKU", "value": "ELECROW-LML15607D"}]	\N	\N	\N
e9774e8a-a645-4688-8122-7d03999c92a9	Elecrow ThinkNode M4 Power Bank LoRa Tracker for LoRaWAN	elecrow-thinknode-m4-power-bank-lora-tracker-for-lorawan	Description Elecrow ThinkNode M4 Power Bank LoRa Tracker is a multifunctional LoRaWAN tracker and portable power bank powered by the Nordic nRF52840 platform and Semtech LR1110 LoRa transceiver. ThinkNode M4 combines…	3b540004-b6f6-4597-9190-fd4fcdaf41ab	2026-07-11 12:36:18.916064+00	[{"label": "Thương hiệu", "value": "Elecrow"}, {"label": "SKU", "value": "ELECROW-LMM14004D2"}]	\N	\N	\N
b3bcbb51-8efb-4529-a701-46776f60325c	Hiwonder JetAuto Pro Ultimate ROS Robot Car Raspberry Pi 5	hiwonder-jetauto-pro-ultimate-ros-robot-car-raspberry-pi-5	Hiwonder JetAuto Pro Ultimate ROS Robot Car Raspberry Pi 5 This Ultimate Kit with Raspberry Pi 5 8GB configuration belongs to Hiwonder's JetAuto Pro AI robotics line. It is intended for ROS education, robot development,…	b32a4ff7-fb62-434e-a198-535256aa68e6	2026-07-11 12:36:18.916064+00	[{"label": "Thương hiệu", "value": "Hiwonder"}, {"label": "SKU", "value": "Hiwonder-21030806"}]	\N	\N	\N
ba6df3e1-282a-4f62-a1d1-66fa892105ef	Hiwonder TonyPi Pro Humanoid Robot Raspberry Pi 5 with Memory Options	hiwonder-tonypi-pro-humanoid-robot-raspberry-pi-5-with-memory-options	Hiwonder TonyPi Pro Humanoid Robot Raspberry Pi 5 with Memory Options The Hiwonder TonyPi Pro Humanoid Robot Raspberry Pi 5 is available in selectable Type configurations: 2GB , 4GB , 8GB , 16GB . This keeps the same…	b32a4ff7-fb62-434e-a198-535256aa68e6	2026-07-11 12:36:18.916064+00	[{"label": "Thương hiệu", "value": "Hiwonder"}, {"label": "SKU", "value": "Hiwonder-21020135"}]	\N	\N	\N
8035e06a-3494-473d-a7e1-dd42cfea2ce6	Hiwonder PuppyPi Pro Ultimate Quadruped Robot Raspberry Pi 5 with Memory Options	hiwonder-puppypi-pro-ultimate-quadruped-robot-raspberry-pi-5-with-memory-options	Hiwonder PuppyPi Pro Ultimate Quadruped Robot Raspberry Pi 5 with Memory Options The Hiwonder PuppyPi Pro Ultimate Quadruped Robot Raspberry Pi 5 is available in selectable Type configurations: 2GB , 4GB , 8GB . This…	b32a4ff7-fb62-434e-a198-535256aa68e6	2026-07-11 12:36:18.916064+00	[{"label": "Thương hiệu", "value": "Hiwonder"}, {"label": "SKU", "value": "Hiwonder-21040148"}]	\N	\N	\N
28fa3a2f-0bc6-4002-b614-89d53ceef51c	Adafruit Circuit Playground Express	adafruit-circuit-playground-express	Circuit Playground Express is the next step towards a perfect introduction to electronics and programming. We've taken the original Circuit Playground Classic and made it even better! Not only did we pack even more…	f7fa2bc8-0760-4de6-959e-5644aa29e711	2026-07-11 12:36:18.916064+00	[{"label": "Thương hiệu", "value": "Adafruit"}, {"label": "SKU", "value": "Adafruit-3333"}]	https://learn.adafruit.com/adafruit-circuit-playground-express	https://github.com/adafruit/Adafruit_CircuitPlayground	Adafruit
8ea34135-2601-4d4f-b46d-4c94fdc1b284	LILYGO T-Echo Lite Kit nRF52840 LoRa E-Paper GNSS	lilygo-t-echo-lite-kit-nrf52840-lora-e-paper-gnss	Description The LILYGO T-Echo Lite Kit is a compact nRF52840 LoRa development kit with an SX1262 LoRa transceiver , 1.22 inch SPI e-paper display, TCA8418 keyboard support, audio, vibration motor, and optional L76K GNSS…	11111111-1111-1111-1111-111111111111	2026-07-11 12:36:18.916064+00	[{"label": "Thương hiệu", "value": "LILYGO"}, {"label": "SKU", "value": "LILYGO-K279"}]	https://github.com/Xinyuan-LilyGO/T-Echo/blob/main/schematic/T-Echo_Schematic.pdf	https://github.com/Xinyuan-LilyGO/T-Echo-Lite	LILYGO
d84811db-dee4-46e9-aeb3-5a9df7cc466e	Boardoza GP-02 BDS/GNSS Module	boardoza-gp-02-bds-gnss-module	Description Boardoza GP-02 BDS/GNSS Module is a compact multi-mode satellite navigation receiver breakout board for embedded positioning, asset tracking, outdoor robotics, automotive navigation prototypes, and…	3b540004-b6f6-4597-9190-fd4fcdaf41ab	2026-07-11 12:36:18.916064+00	[{"label": "Thương hiệu", "value": "Boardoza"}, {"label": "SKU", "value": "Boardoza-BBV10000034"}]	\N	\N	\N
16535157-f3f5-40f8-b193-78791fe1e60f	Boardoza UBLOX SAM M8Q GNSS Module	boardoza-ublox-sam-m8q-gnss-module	Description Boardoza UBLOX SAM M8Q GNSS Module is a compact multi-GNSS receiver breakout board for positioning, navigation, tracking, drone, robotics, and IoT geolocation projects. Built around the u-blox SAM-M8Q…	3b540004-b6f6-4597-9190-fd4fcdaf41ab	2026-07-11 12:36:18.916064+00	[{"label": "Thương hiệu", "value": "Boardoza"}, {"label": "SKU", "value": "Boardoza-BBV10000031"}]	\N	\N	\N
8406dc6b-145e-46e7-a5d2-44fae50f8c03	Waveshare GNSS L1+L2+L5 Multi-Frequency Active Antenna SMA-J	waveshare-gnss-l1-l2-l5-multi-frequency-active-antenna-sma-j	Description The Waveshare GNSS L1+L2+L5 Multi-Frequency Active Antenna is a rugged external GNSS antenna for precise positioning applications. It supports multiple satellite positioning systems including BDS, GPS,…	3b540004-b6f6-4597-9190-fd4fcdaf41ab	2026-07-11 12:36:18.916064+00	[{"label": "Thương hiệu", "value": "Waveshare"}, {"label": "SKU", "value": "Waveshare-25482"}]	\N	\N	\N
5aa8071f-47d3-4893-89c0-46937806ff19	Boardoza AMS1117-5V Voltage Regulator	boardoza-ams1117-5v-voltage-regulator	Description Boardoza AMS1117-5V Voltage Regulator is a low-dropout linear voltage regulator breakout board that provides a stable 5V output from a 6.2V to 12V input source. The module is designed for powering…	3b540004-b6f6-4597-9190-fd4fcdaf41ab	2026-07-11 12:36:18.916064+00	[{"label": "Thương hiệu", "value": "Boardoza"}, {"label": "SKU", "value": "Boardoza-BM2V10000005"}]	\N	\N	\N
bd5f943c-e66b-4c7c-8444-323b17a6eae8	Waveshare IMX378-190 12.3MP Fisheye Camera Type B	waveshare-imx378-190-12-3mp-fisheye-camera-type-b	Description The Waveshare IMX378-190 12.3MP Camera (B) is a Raspberry Pi compatible fisheye camera built around the IMX378 sensor . It provides 12.3MP resolution , 4056 x 3040 image output, a 190 degree FOV , and a…	3b540004-b6f6-4597-9190-fd4fcdaf41ab	2026-07-11 12:36:18.916064+00	[{"label": "Thương hiệu", "value": "Waveshare"}, {"label": "SKU", "value": "Waveshare-34709"}]	\N	\N	\N
5e1bcf72-5340-48c7-9f5d-0aa9d524f71f	Orange Pi 5 Pro RK3588S Single Board Computer	orange-pi-5-pro-rk3588s-single-board-computer	Description The Orange Pi 5 Pro is a powerful RK3588S single board computer for edge computing, AIoT, multimedia, embedded Linux, and Android development. It combines the Rockchip RK3588S octa-core processor, 4GB, 8GB,…	11111111-1111-1111-1111-111111111111	2026-07-11 12:36:18.916064+00	[{"label": "Thương hiệu", "value": "Orange Pi"}, {"label": "SKU", "value": "OrangePi-5Pro-4G"}]	http://www.orangepi.org/html/hardWare/computerAndMicrocontrollers/service-and-support/Orange-Pi-5-Pro.html	https://github.com/orangepi-xunlong/orangepi-build	Orange Pi
168ee732-ece3-429a-9a9a-f45093a2e1e9	Hiwonder MentorPi T1 Advanced WonderEcho Tank Robot Car with Pi5 Options	hiwonder-mentorpi-t1-advanced-wonderecho-tank-robot-car-with-pi5-options	Hiwonder MentorPi T1 Advanced WonderEcho Tank Robot Car with Pi5 Options The Hiwonder MentorPi T1 Advanced WonderEcho Tank Robot Car is available in selectable Type configurations: w/o Raspberry Pi , 2GB , 4GB , 8GB ,…	b32a4ff7-fb62-434e-a198-535256aa68e6	2026-07-11 12:36:18.916064+00	[{"label": "Thương hiệu", "value": "Hiwonder"}, {"label": "SKU", "value": "Hiwonder-21030952"}]	\N	\N	\N
8010f6c8-7eba-43c8-a43a-e91163b3ee4d	Hiwonder ArmPi FPV Standard AI Vision Robotic Arm 4B with Memory Options	hiwonder-armpi-fpv-standard-ai-vision-robotic-arm-4b-with-memory-options	Hiwonder ArmPi FPV Standard AI Vision Robotic Arm 4B with Memory Options The Hiwonder ArmPi FPV Standard AI Vision Robotic Arm is available in selectable Type configurations: w/o Raspberry Pi 4B , 4B 4GB . This keeps…	8932e94a-1428-4204-87b7-513e6e9f327e	2026-07-11 12:36:18.916064+00	[{"label": "Thương hiệu", "value": "Hiwonder"}, {"label": "SKU", "value": "Hiwonder-21010143"}]	\N	\N	\N
ebb1c988-17b5-47ee-bed3-dd3caa2071ae	Hiwonder ArmPi Mini 5DOF Vision Robot Arm with Pi5 Options	hiwonder-armpi-mini-5dof-vision-robot-arm-with-pi5-options	Hiwonder ArmPi Mini 5DOF Vision Robot Arm with Pi5 Options The Hiwonder ArmPi Mini 5DOF Vision Robot Arm is available in selectable Type configurations: w/o Raspberry Pi , 2GB , 4GB , 8GB . This keeps the same Hiwonder…	8932e94a-1428-4204-87b7-513e6e9f327e	2026-07-11 12:36:18.916064+00	[{"label": "Thương hiệu", "value": "Hiwonder"}, {"label": "SKU", "value": "Hiwonder-21010183"}]	\N	\N	\N
85f4fb59-c8e7-4ffa-94a5-dffda17da975	MyActuator RMD-X8-P20-120-E 120Nm Planetary Servo Actuator Motor	myactuator-rmd-x8-p20-120-e-120nm-planetary-servo-actuator-motor	MyActuator RMD-X8-P20-120-E 120Nm Planetary Servo Actuator Motor is a MyActuator RMD-X series planetary servo actuator motor in the EtherCAT-oriented E configuration. The X8-120 product information lists 19.612 gear…	78f52bb2-de1d-4915-925d-b71a027f02f7	2026-07-11 12:36:18.916064+00	[{"label": "Thương hiệu", "value": "MyActuator"}, {"label": "SKU", "value": "RMD-X8-P20-120-E"}]	\N	\N	\N
2c46b6e2-0f2c-4f10-b129-11e0fa678c98	FEETECH HL-3612 Servo Motor	feetech-hl-3612-servo-motor	The FEETECH HL-3612 Servo Motor is a FEETECH TTL serial bus servo option for robotics, humanoid joints, robotic arms, exoskeletons, AGV mechanisms, and experimental motion platforms. This listing is organized with the…	78f52bb2-de1d-4915-925d-b71a027f02f7	2026-07-11 12:36:18.916064+00	[{"label": "Thương hiệu", "value": "FEETECH"}, {"label": "SKU", "value": "Feetech-HLS3612-C001"}]	\N	\N	\N
81ea7532-1977-4347-91c0-fdb07899d00b	Boardoza VNH5019 w/ENC Elite	boardoza-vnh5019-w-enc-elite	Description Boardoza VNH5019 w/ENC Elite is a high-power H-bridge motor driver breakout board built around the STMicroelectronics VNH5019A-E full-bridge motor driver IC. Designed for automotive, industrial, and…	78f52bb2-de1d-4915-925d-b71a027f02f7	2026-07-11 12:36:18.916064+00	[{"label": "Thương hiệu", "value": "Boardoza"}, {"label": "SKU", "value": "Boardoza-B0601V10000184"}]	\N	\N	\N
742ae0ab-496c-4702-bccd-581ffee02ac5	Seeed Studio Hightorque HTDW-6056-36-NE-JC 1:36 Gear Motor CAN	seeed-studio-hightorque-htdw-6056-36-ne-jc-1-36-gear-motor-can	Seeed Studio Hightorque HTDW-6056-36-NE-JC 1:36 Gear Motor CAN is an integrated planetary gear motor for robot arms, biped humanoids, and compact robotic joint development. A 1:36 integrated actuator module for robot…	78f52bb2-de1d-4915-925d-b71a027f02f7	2026-07-11 12:36:18.916064+00	[{"label": "Thương hiệu", "value": "Seeed Studio"}, {"label": "SKU", "value": "Seeed-100036262"}]	\N	\N	\N
af5e1410-fa3b-482d-a11d-5db2bcd040bb	Matek H743 Slim V3 FC FPV Drone Controller No Current Sensor Built-in	matek-h743-slim-v3-fc-fpv-drone-controller-no-current-sensor-built-in	Matek H743 Slim V3 FC FPV Drone Controller No Current Sensor Built-in Matek H743 Slim V3 FC FPV Drone Controller No Current Sensor Built-in is a compact H743-class flight controller for FPV drone, fixed-wing, and…	a9b909e7-5938-4dbf-a198-330933ba2249	2026-07-11 12:36:18.916064+00	[{"label": "Thương hiệu", "value": "OpenELAB"}, {"label": "SKU", "value": "TB-MH743-SLIMV3-NCS-BI"}]	\N	\N	\N
b2d6352a-617e-4ee0-8a1d-ff06b001abf7	iFlight Nazgul XL10 V6 10 inch FPV Frame Kit	iflight-nazgul-xl10-v6-10-inch-fpv-frame-kit	iFlight Nazgul XL10 V6 Frame Overview iFlight Nazgul XL10 V6 is a 10 inch FPV drone frame kit for long-range, cinematic, and high-stability 10 inch builds. The V6 frame uses a full 3K carbon fiber airframe, a wide…	a9b909e7-5938-4dbf-a198-330933ba2249	2026-07-11 12:36:18.916064+00	[{"label": "Thương hiệu", "value": "OpenELAB"}, {"label": "SKU", "value": "TB-XL106"}]	\N	\N	\N
6bd8fa55-d8f6-47be-91a0-7b67d4bc2ba6	Holybro X650 Development Kit | Pixhawk 6C | 650mm Drone Frame	holybro-x650-development-kit-pixhawk-6c-650mm-drone-frame	Holybro X650 Development Kit | Pixhawk 6C | 650mm Drone Frame The Holybro X650 Development Kit is a 650 mm carbon-fiber drone platform for PX4-oriented research, mapping, robotics, payload testing, and…	a9b909e7-5938-4dbf-a198-330933ba2249	2026-07-11 12:36:18.916064+00	[{"label": "Thương hiệu", "value": "OpenELAB"}, {"label": "SKU", "value": "Holybro-X650-FK"}]	\N	\N	\N
639d20d7-7930-4b7b-b69e-b644a719ef50	T-MOTOR VELOX V3115 900KV Cinematic FPV Motor	t-motor-velox-v3115-900kv-cinematic-fpv-motor	T-MOTOR VELOX V3115 900KV Overview T-MOTOR VELOX V3115 900KV is a cinematic FPV brushless motor for large X4 and X8 multirotor builds. The V3115 platform is designed for 8-11 inch propeller classes and heavy-payload…	a9b909e7-5938-4dbf-a198-330933ba2249	2026-07-11 12:36:18.916064+00	[{"label": "Thương hiệu", "value": "OpenELAB"}, {"label": "SKU", "value": "TB-V3115-900KV"}]	\N	\N	\N
dc6305d8-63b1-44d7-8b27-5efb55bdad1f	MAD 5010 EEE 110KV Brushless Drone Motor for Mapping UAV	mad-5010-eee-110kv-brushless-drone-motor-for-mapping-uav	MAD 5010 EEE 110KV is a brushless drone motor variant for long-range inspection, mapping, surveying, and multirotor UAV platforms. The selected product variant is 110KV . The product page lists 1.5-2 kg sustained thrust…	a9b909e7-5938-4dbf-a198-330933ba2249	2026-07-11 12:36:18.916064+00	[{"label": "Thương hiệu", "value": "MAD Components"}, {"label": "SKU", "value": "MAD-5010-EEE-110KV"}]	\N	\N	\N
cc1e52c6-86db-4769-bc48-ecbf950fa4e8	Matek M10Q-5883 GPS Compass Module for Fixed Wing FPV	matek-m10q-5883-gps-compass-module-for-fixed-wing-fpv	Matek M10Q-5883 GPS Compass Module for Fixed Wing FPV Matek M10Q-5883 GPS Compass Module for Fixed Wing FPV combines a u-blox M10-series GNSS receiver, QMC5883L compass, and compact patch antenna in a lightweight module…	a9b909e7-5938-4dbf-a198-330933ba2249	2026-07-11 12:36:18.916064+00	[{"label": "Thương hiệu", "value": "OpenELAB"}, {"label": "SKU", "value": "TB-M10Q5883"}]	\N	\N	\N
c96f7652-ed90-4379-96e5-f5d58ae1c3c9	Waveshare 1.46inch Touch LCD Display Module 412 x 412	waveshare-1-46inch-touch-lcd-display-module-412-x-412	Description The Waveshare 1.46inch Touch LCD Module is a compact capacitive touch display module with a 412 x 412 IPS panel , 16.7M colors, and an integrated SPD2010 display and touch controller . It uses a QSPI display…	3326e22d-68ad-4251-8370-50eab9e73bcb	2026-07-11 12:36:18.916064+00	[{"label": "Thương hiệu", "value": "Waveshare"}, {"label": "SKU", "value": "Waveshare-34955"}]	\N	\N	\N
71bcd8a8-0b68-4a8b-a08f-83c2304db557	Waveshare 6.25inch DSI Capacitive Touch Display Type B 720x1560	waveshare-6-25inch-dsi-capacitive-touch-display-type-b-720x1560	Description The Waveshare 6.25inch DSI LCD B is a compact 6.25inch DSI capacitive touch display with 720x1560 resolution , an IPS panel, 500cd/m2 brightness, and 5-point capacitive touch. It is designed for Raspberry Pi…	3326e22d-68ad-4251-8370-50eab9e73bcb	2026-07-11 12:36:18.916064+00	[{"label": "Thương hiệu", "value": "Waveshare"}, {"label": "SKU", "value": "Waveshare-35000"}]	\N	\N	\N
e1f26e35-2a2d-4d80-a089-b6d6b6f18c2a	Waveshare 11inch High Resolution Capacitive Touch Display 1920x1200	waveshare-11inch-high-resolution-capacitive-touch-display-1920x1200	Description The Waveshare 11EP-CAPLCD 11inch High Resolution Capacitive Touch Display is an 11-inch HDMI IPS touch display with 1920x1200 resolution , 10-point capacitive touch , optical bonding toughened glass, and a…	3326e22d-68ad-4251-8370-50eab9e73bcb	2026-07-11 12:36:18.916064+00	[{"label": "Thương hiệu", "value": "Waveshare"}, {"label": "SKU", "value": "Waveshare-35045"}]	\N	\N	\N
520d87a1-ee2d-4238-b652-f46b067ebbed	Waveshare Luckfox 21.5inch 144Hz IPS Touch Monitor 1920x1080	waveshare-luckfox-21-5inch-144hz-ips-touch-monitor-1920x1080	Description The Waveshare Luckfox 21.5inch IPS Touch Monitor is a large portable display with 1920x1080 resolution , 144Hz refresh rate , and 10-point capacitive touch . It includes a foldable stand and supports Mini…	3326e22d-68ad-4251-8370-50eab9e73bcb	2026-07-11 12:36:18.916064+00	[{"label": "Thương hiệu", "value": "Waveshare"}, {"label": "SKU", "value": "Waveshare-34986"}]	\N	\N	\N
1470cee8-6c2f-415c-b469-b38de8191a94	GooDisplay 2.66 inch 4-Color E Ink Display GDEY0266F51	goodisplay-2-66-inch-4-color-e-ink-display-gdey0266f51	GooDisplay 2.66 inch 4-Color E Ink Display GDEY0266F51 is a compact reflective four-color electronic paper panel designed for low-power display applications such as signage, smart devices, and embedded status displays.…	3326e22d-68ad-4251-8370-50eab9e73bcb	2026-07-11 12:36:18.916064+00	[{"label": "Thương hiệu", "value": "GooDisplay"}, {"label": "SKU", "value": "GooDisplay-GDEY0266F51"}]	\N	\N	\N
daf40a3e-f35d-4a45-a1b8-8ae690d65ea1	Elecrow CrowView Note 14 inch Portable Monitor Keyboard Lapdock	elecrow-crowview-note-14-inch-portable-monitor-keyboard-lapdock	Description ELECROW-CRV12214D-EN is the Elecrow CrowView Note 14 inch portable monitor keyboard lapdock, an all-in-one portable workstation that turns a phone, Raspberry Pi, Jetson Nano, mini PC, PC, Steam Deck,…	3326e22d-68ad-4251-8370-50eab9e73bcb	2026-07-11 12:36:18.916064+00	[{"label": "Thương hiệu", "value": "Elecrow"}, {"label": "SKU", "value": "ELECROW-CRV12214D-EN"}]	\N	\N	\N
466a989d-f405-4a25-9651-810a4b933b4c	Waveshare Aluminum Alloy Case for Jetson Orin with Camera Holder	waveshare-aluminum-alloy-case-for-jetson-orin-with-camera-holder	Description The Waveshare JETSON-ORIN-CASE-B is an aluminum alloy case for Jetson Orin with a camera holder . Waveshare lists it as suitable for Jetson Orin Nano and Jetson Orin NX Dual ETH Kits . The Jetson Orin kit…	0a92ed93-8921-45d8-ae28-e98cbe69f481	2026-07-11 12:36:18.916064+00	[{"label": "Thương hiệu", "value": "Waveshare"}, {"label": "SKU", "value": "Waveshare-34998"}]	\N	\N	\N
b60b2a9e-d5da-4c8b-b31f-cc7ce0922198	Waveshare PCIe Dual 2.5G Ethernet HAT+ for Raspberry Pi 5	waveshare-pcie-dual-2-5g-ethernet-hat-for-raspberry-pi-5	Description The Waveshare PCIE TO 2-CH 2.5G ETH HAT+ is a PCIe dual 2.5G Ethernet expansion HAT designed for Raspberry Pi 5 . It uses the Raspberry Pi 5 16-pin PCIe connector and adds two RJ45 Ethernet ports through…	0a92ed93-8921-45d8-ae28-e98cbe69f481	2026-07-11 12:36:18.916064+00	[{"label": "Thương hiệu", "value": "Waveshare"}, {"label": "SKU", "value": "Waveshare-34932"}]	\N	\N	\N
70f1668a-f91c-4f21-89be-0a662d1c3e6a	Seeed Studio AC/DC Power Adapter 12V 2A 5-in-1	seeed-studio-ac-dc-power-adapter-12v-2a-5-in-1	Description The Seeed Studio AC/DC Power Adapter 12V 2A 5-in-1 is a compact 12V 2A power adapter with interchangeable UK, US, EU, AU, and KR plugs. According to Seeed, it delivers 12.0Vdc at 2.0A and up to 24W output…	0a92ed93-8921-45d8-ae28-e98cbe69f481	2026-07-11 12:36:18.916064+00	[{"label": "Thương hiệu", "value": "Seeed Studio"}, {"label": "SKU", "value": "Seeed-100033211"}]	\N	\N	\N
073b828f-78c1-411d-82d1-48c6a5fabeb7	Boardoza Phoenix24 Modular ARGB LED	boardoza-phoenix24-modular-argb-led	Description Boardoza Phoenix24 Modular ARGB LED is an addressable RGB LED breakout board with 24 individually controllable LEDs. It is designed for vibrant dynamic lighting effects while maintaining reliable signal…	0a92ed93-8921-45d8-ae28-e98cbe69f481	2026-07-11 12:36:18.916064+00	[{"label": "Thương hiệu", "value": "Boardoza"}, {"label": "SKU", "value": "Boardoza-B0501V10000108"}]	\N	\N	\N
c6da69a9-d951-4027-b795-93ebb02073da	Boardoza Phoenix12 Modular ARGB LED	boardoza-phoenix12-modular-argb-led	Description Boardoza Phoenix12 Modular ARGB LED is a ring-shaped addressable RGB LED breakout board with 12 individually controllable RGB LEDs arranged around an open center. The circular layout is designed for uniform…	0a92ed93-8921-45d8-ae28-e98cbe69f481	2026-07-11 12:36:18.916064+00	[{"label": "Thương hiệu", "value": "Boardoza"}, {"label": "SKU", "value": "Boardoza-B0501V10000106"}]	\N	\N	\N
ec2d9ae6-fb1b-49c9-98ac-ea64333480cb	LILYGO SIM-DC-Shield for T-SIM DC Expansion	lilygo-sim-dc-shield-for-t-sim-dc-expansion	Description The LILYGO SIM-DC-Shield is an official SIM-DC-Shield H812 accessory from LILYGO for T-SIM DC expansion and prototyping. It is supplied as a compact shield board for users who need a dedicated T-SIM DC…	0a92ed93-8921-45d8-ae28-e98cbe69f481	2026-07-11 12:36:18.916064+00	[{"label": "Thương hiệu", "value": "LILYGO"}, {"label": "SKU", "value": "LILYGO-H812"}]	\N	\N	\N
cf0d4a50-8576-48bd-bba2-01b199eb8779	STMicroelectronics Small Module v5	stmicroelectronics-small-module-v5-0NHe	Introducing the Philippines-inspired Mouse, blending colossal style with local craftsmanship	64310b96-0c11-4ec8-abe8-f7592c002004	2026-09-26 15:21:14.344534+00	[]	\N	\N	STMicroelectronics
fd8c393d-79f0-489f-8925-b699de8eef4d	Raspberry Pi Licensed Module v1	raspberry-pi-licensed-module-v1-1Rsu	Introducing the Oman-inspired Gloves, blending limp style with local craftsmanship	64310b96-0c11-4ec8-abe8-f7592c002004	2026-09-26 15:21:14.353857+00	[]	\N	\N	Raspberry Pi
3fff393a-ca1d-41bd-b909-2bf3400ee0a2	NVIDIA Fantastic Module v1	nvidia-fantastic-module-v1-tUA2	Ergonomic Shoes made with Aluminum for all-day awesome support	64310b96-0c11-4ec8-abe8-f7592c002004	2026-09-26 15:21:14.356156+00	[]	\N	\N	NVIDIA
65f8a183-63f7-4cf3-89b5-604e625c0615	Sensirion Oriental Module v3	sensirion-oriental-module-v3-sqWT	Professional-grade Ball perfect for oily training and recreational use	64310b96-0c11-4ec8-abe8-f7592c002004	2026-09-26 15:21:14.359122+00	[]	\N	\N	Sensirion
614e6cd1-a790-4c2b-8914-f859f809ef29	STMicroelectronics Intelligent Module v3	stmicroelectronics-intelligent-module-v3-3Vre	Savor the fresh essence in our Tuna, designed for self-reliant culinary adventures	64310b96-0c11-4ec8-abe8-f7592c002004	2026-09-26 15:21:14.361019+00	[]	\N	\N	STMicroelectronics
bfb11b53-6ab2-4422-ba6a-914c3c5bcf10	Sensirion Gorgeous Module v2	sensirion-gorgeous-module-v2-02Gn	Stylish Table designed to make you stand out with monthly looks	64310b96-0c11-4ec8-abe8-f7592c002004	2026-09-26 15:21:14.362447+00	[]	\N	\N	Sensirion
4ece8cf5-5eee-4d16-97a5-96156103d0d4	NVIDIA Handmade Module v5	nvidia-handmade-module-v5-fczR	The sleek and likely Hat comes with orchid LED lighting for smart functionality	64310b96-0c11-4ec8-abe8-f7592c002004	2026-09-26 15:21:14.363984+00	[]	\N	\N	NVIDIA
b094b4a7-3496-42ce-9f10-ffe99084d86b	Sensirion Tasty Module v2	sensirion-tasty-module-v2-LkbS	Featuring Oxygen-enhanced technology, our Hat offers unparalleled whimsical performance	64310b96-0c11-4ec8-abe8-f7592c002004	2026-09-26 15:21:14.365341+00	[]	\N	\N	Sensirion
b3da4816-04ee-4733-af1d-a8777afa4344	Seeed Studio Intelligent Module v2	seeed-studio-intelligent-module-v2-frgE	Prohaska - Reilly's most advanced Table technology increases acceptable capabilities	64310b96-0c11-4ec8-abe8-f7592c002004	2026-09-26 15:21:14.367008+00	[]	\N	\N	Seeed Studio
ffe4b1dd-26c3-459e-ba92-0bbdbe5f0d89	NVIDIA Handmade Module v2	nvidia-handmade-module-v2-nL1d	Experience the green brilliance of our Pizza, perfect for wordy environments	64310b96-0c11-4ec8-abe8-f7592c002004	2026-09-26 15:21:14.368274+00	[]	\N	\N	NVIDIA
bc986bfa-1bd4-4232-8659-d9d089ba3490	Espressif Soft Module v2	espressif-soft-module-v2-M7Eb	Our dolphin-friendly Chips ensures finished comfort for your pets	64310b96-0c11-4ec8-abe8-f7592c002004	2026-09-26 15:21:14.369533+00	[]	\N	\N	Espressif
193436db-d64d-4b00-936b-c9894b22caf1	Sensirion Small Module v4	sensirion-small-module-v4-f9Ug	Discover the sunny new Bike with an exciting mix of Concrete ingredients	64310b96-0c11-4ec8-abe8-f7592c002004	2026-09-26 15:21:14.371062+00	[]	\N	\N	Sensirion
f0bb03c2-af0f-4580-b763-cf5228f5e097	STMicroelectronics Recycled Module v3	stmicroelectronics-recycled-module-v3-Hpfr	New teal Pants with ergonomic design for courageous comfort	64310b96-0c11-4ec8-abe8-f7592c002004	2026-09-26 15:21:14.372818+00	[]	\N	\N	STMicroelectronics
280153c7-fe5a-452c-a79b-005f9e5bc839	Raspberry Pi Handmade Module v5	raspberry-pi-handmade-module-v5-xb2O	Discover the rhinoceros-like agility of our Keyboard, perfect for somber users	64310b96-0c11-4ec8-abe8-f7592c002004	2026-09-26 15:21:14.374272+00	[]	\N	\N	Raspberry Pi
3ebaf38a-2d61-47c6-8921-bbef2a194c03	STMicroelectronics Handmade Module v5	stmicroelectronics-handmade-module-v5-uNuC	The sleek and imaginary Pants comes with black LED lighting for smart functionality	64310b96-0c11-4ec8-abe8-f7592c002004	2026-09-26 15:21:14.375555+00	[]	\N	\N	STMicroelectronics
599446fa-e579-4e3c-8194-604bd6ced0e0	Sensirion Rustic Module v2	sensirion-rustic-module-v2-OGVs	Introducing the Ghana-inspired Chicken, blending dead style with local craftsmanship	64310b96-0c11-4ec8-abe8-f7592c002004	2026-09-26 15:21:14.376739+00	[]	\N	\N	Sensirion
501da833-f82b-415f-86b0-d59dbcb41a21	NVIDIA Rustic Module v3	nvidia-rustic-module-v3-63H8	New olive Chair with ergonomic design for our comfort	64310b96-0c11-4ec8-abe8-f7592c002004	2026-09-26 15:21:14.378018+00	[]	\N	\N	NVIDIA
167f1da2-5a0a-4b17-91e2-80fbf4cc72eb	STMicroelectronics Soft Module v4	stmicroelectronics-soft-module-v4-xS3x	Our horse-friendly Salad ensures respectful comfort for your pets	64310b96-0c11-4ec8-abe8-f7592c002004	2026-09-26 15:21:14.379336+00	[]	\N	\N	STMicroelectronics
56cf4d21-33d7-4ea8-9e20-8cd6c68e3249	STMicroelectronics Small Module v4	stmicroelectronics-small-module-v4-iNto	Medhurst - Wilkinson's most advanced Chair technology increases unwieldy capabilities	64310b96-0c11-4ec8-abe8-f7592c002004	2026-09-26 15:21:14.380581+00	[]	\N	\N	STMicroelectronics
0e5b66c0-71ec-462a-984e-e84b85998bf0	Raspberry Pi Generic Module v5	raspberry-pi-generic-module-v5-uQwm	Savor the smoky essence in our Sausages, designed for wide-eyed culinary adventures	64310b96-0c11-4ec8-abe8-f7592c002004	2026-09-26 15:21:14.381851+00	[]	\N	\N	Raspberry Pi
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, password_hash, created_at, role) FROM stdin;
2aaa04b4-40c3-403f-9e1a-d7c57ac92992	vanthanhntqn97@gmail.com	$2a$10$ejYl9RzHdFGbAeXWn4z7NOZNl/dzXYtxpjgQunPuFJFrjUEzvfMM.	2026-07-26 09:30:59.763443+00	admin
\.


--
-- Name: blog_posts blog_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_pkey PRIMARY KEY (id);


--
-- Name: blog_posts blog_posts_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_slug_key UNIQUE (slug);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: categories categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_key UNIQUE (slug);


--
-- Name: customer_addresses customer_addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_addresses
    ADD CONSTRAINT customer_addresses_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: hero_banners hero_banners_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hero_banners
    ADD CONSTRAINT hero_banners_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: product_images product_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_pkey PRIMARY KEY (id);


--
-- Name: product_variants product_variants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_pkey PRIMARY KEY (id);


--
-- Name: product_variants product_variants_sku_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_sku_key UNIQUE (sku);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: products products_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_slug_key UNIQUE (slug);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: categories categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id);


--
-- Name: customer_addresses customer_addresses_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_addresses
    ADD CONSTRAINT customer_addresses_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: customers customers_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_id_fkey FOREIGN KEY (id) REFERENCES public.users(id);


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id);


--
-- Name: orders orders_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: product_images product_images_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: product_variants product_variants_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: blog_posts Public read blog_posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read blog_posts" ON public.blog_posts FOR SELECT USING (true);


--
-- Name: categories Public read categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);


--
-- Name: product_images Public read images; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read images" ON public.product_images FOR SELECT USING (true);


--
-- Name: products Public read products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);


--
-- Name: product_variants Public read variants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read variants" ON public.product_variants FOR SELECT USING (true);


--
-- Name: blog_posts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict 2cWgNPpPcibJkx4Bw203qCZjiaXAF4rA0ZDQS7SMD4muc3DcGAJhRWm5Lv2fFmp

