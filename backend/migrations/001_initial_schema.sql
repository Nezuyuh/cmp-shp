-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Products table
create table products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  brand text not null,
  category text not null check (category in ('CPU','Motherboard','RAM','GPU','Case','PSU','Cooler','Storage','Fan')),
  price decimal(10,2) not null,
  stock integer not null default 0,
  sku text unique not null,
  image_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Product variants
create table product_variants (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) on delete cascade,
  label text not null,
  price decimal(10,2) not null,
  stock integer not null default 0,
  sku text unique not null,
  attributes jsonb default '{}',
  created_at timestamptz default now()
);

-- CPU specs
create table cpu_specs (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) on delete cascade unique,
  socket_type text not null,
  tdp_watts integer not null,
  includes_cooler boolean default false,
  max_mem_speed_mhz integer not null,
  has_integrated_graphics boolean default false
);

-- Motherboard specs
create table motherboard_specs (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) on delete cascade unique,
  socket_type text not null,
  form_factor text not null,
  ram_type text not null,
  ram_slots integer not null,
  max_ram_capacity_gb integer not null,
  max_mem_speed_mhz integer not null,
  pcie_x16_slots integer default 1,
  pcie_x1_slots integer default 0,
  m2_slots_count integer default 0,
  sata_ports_count integer default 0,
  eps_power_connectors text,
  internal_usb_headers text[],
  rgb_headers_5v_argb integer default 0,
  rgb_headers_12v_rgb integer default 0
);

-- RAM specs
create table ram_specs (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) on delete cascade unique,
  ram_type text not null,
  form_factor text not null,
  modules_count integer not null,
  total_capacity_gb integer not null,
  speed_mhz integer not null,
  height_mm decimal(5,1)
);

-- GPU specs
create table gpu_specs (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) on delete cascade unique,
  length_mm integer not null,
  slot_width_thickness decimal(4,2),
  height_clearance_mm integer,
  tdp_watts integer not null,
  recommended_psu_wattage integer,
  power_connectors text[],
  pcie_generation text
);

-- Case specs
create table case_specs (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) on delete cascade unique,
  supported_mobo_form_factors text[],
  max_gpu_length_mm integer,
  max_gpu_height_clearance_mm integer,
  max_cpu_cooler_height_mm integer,
  supported_psu_form_factors text[],
  max_psu_length_mm integer,
  front_panel_ports text[],
  fan_120mm_max integer default 0,
  fan_140mm_max integer default 0,
  radiator_top_mm integer,
  radiator_side_mm integer,
  radiator_bottom_mm integer,
  drive_bays_3_5 integer default 0,
  drive_bays_2_5 integer default 0
);

-- PSU specs
create table psu_specs (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) on delete cascade unique,
  wattage integer not null,
  form_factor text not null,
  length_mm integer,
  modular_type text,
  pcie_12vhpwr_connectors integer default 0,
  pcie_6plus2_connectors integer default 0,
  eps_8pin_connectors integer default 0
);

-- Cooler specs
create table cooler_specs (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) on delete cascade unique,
  cooler_type text not null check (cooler_type in ('Air','Liquid')),
  supported_sockets text[],
  height_mm integer,
  ram_clearance_mm decimal(5,1),
  tdp_handling_watts integer not null,
  radiator_size_mm integer,
  fan_connector_type text
);

-- Storage specs
create table storage_specs (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) on delete cascade unique,
  storage_type text not null,
  form_factor text not null,
  interface text not null,
  requires_sata_port boolean default false
);

-- Fan specs
create table fan_specs (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) on delete cascade unique,
  size_mm integer not null,
  thickness_mm integer,
  connector_type text,
  is_rgb boolean default false
);

-- PC Builds
create table pc_builds (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  components jsonb not null default '{}',
  total_price decimal(10,2) not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Orders
create table orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','processing','shipped','delivered','cancelled')),
  total_price decimal(10,2) not null,
  shipping_address jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Order items
create table order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  variant_id uuid references product_variants(id) on delete set null,
  quantity integer not null default 1,
  unit_price decimal(10,2) not null
);

-- User profiles (extends Supabase auth.users)
create table user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('user','admin')),
  full_name text,
  created_at timestamptz default now()
);

-- RLS Policies
alter table products enable row level security;
alter table product_variants enable row level security;
alter table cpu_specs enable row level security;
alter table motherboard_specs enable row level security;
alter table ram_specs enable row level security;
alter table gpu_specs enable row level security;
alter table case_specs enable row level security;
alter table psu_specs enable row level security;
alter table cooler_specs enable row level security;
alter table storage_specs enable row level security;
alter table fan_specs enable row level security;
alter table pc_builds enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table user_profiles enable row level security;

-- Public read access for products and specs
create policy "Public read products" on products for select using (true);
create policy "Public read variants" on product_variants for select using (true);
create policy "Public read cpu_specs" on cpu_specs for select using (true);
create policy "Public read motherboard_specs" on motherboard_specs for select using (true);
create policy "Public read ram_specs" on ram_specs for select using (true);
create policy "Public read gpu_specs" on gpu_specs for select using (true);
create policy "Public read case_specs" on case_specs for select using (true);
create policy "Public read psu_specs" on psu_specs for select using (true);
create policy "Public read cooler_specs" on cooler_specs for select using (true);
create policy "Public read storage_specs" on storage_specs for select using (true);
create policy "Public read fan_specs" on fan_specs for select using (true);

-- Users can read/write own builds
create policy "Users manage own builds" on pc_builds using (auth.uid() = user_id);
create policy "Users read own orders" on orders for select using (auth.uid() = user_id);
create policy "Users read own order items" on order_items for select using (
  exists (select 1 from orders where orders.id = order_items.order_id and orders.user_id = auth.uid())
);
create policy "Users read own profile" on user_profiles for select using (auth.uid() = id);
create policy "Users update own profile" on user_profiles for update using (auth.uid() = id);

-- Indexes
create index on products(category);
create index on products(brand);
create index on product_variants(product_id);
create index on cpu_specs(socket_type);
create index on motherboard_specs(socket_type);
create index on orders(user_id);
create index on pc_builds(user_id);
