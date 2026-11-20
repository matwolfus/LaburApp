-- Esquema de la base de LaburApp: SOLO la estructura (tablas, claves,
-- restricciones, índices y políticas), sin ningún dato.
--
-- Es el primer paso para levantar el proyecto en una base nueva (ver el
-- README, sección "Base de datos y migraciones"). Se corre una sola vez, en
-- una base vacía: si las tablas ya existen, falla en el primer CREATE TABLE.
--
-- Generado a partir de un pg_dump de la base de Supabase, sacando las filas
-- (COPY), los valores de las secuencias y los comandos propios de psql.
-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: categorias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categorias (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    url_avatar character varying
);

--
-- Name: categorias_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categorias_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: categorias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categorias_id_seq OWNED BY public.categorias.id;

--
-- Name: contratos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contratos (
    id integer NOT NULL,
    id_trabajo integer NOT NULL,
    id_postulacion integer NOT NULL,
    id_contratante integer NOT NULL,
    id_trabajador integer NOT NULL,
    precio_acordado numeric(10,2) NOT NULL,
    estado character varying(20) DEFAULT 'activo'::character varying NOT NULL,
    iniciado_en timestamp without time zone,
    completado_en timestamp without time zone,
    creado_en timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT contratos_estado_check CHECK (((estado)::text = ANY ((ARRAY['activo'::character varying, 'completado'::character varying, 'en_disputa'::character varying, 'cancelado'::character varying])::text[])))
);

--
-- Name: contratos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contratos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: contratos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.contratos_id_seq OWNED BY public.contratos.id;

--
-- Name: imagenes_trabajo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.imagenes_trabajo (
    id integer NOT NULL,
    id_trabajo integer NOT NULL,
    url_imagen character varying(500) NOT NULL,
    orden integer DEFAULT 0 NOT NULL
);

--
-- Name: imagenes_trabajo_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.imagenes_trabajo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: imagenes_trabajo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.imagenes_trabajo_id_seq OWNED BY public.imagenes_trabajo.id;

--
-- Name: localidades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.localidades (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    id_provincia integer NOT NULL
);

--
-- Name: localidades_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.localidades_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: localidades_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.localidades_id_seq OWNED BY public.localidades.id;

--
-- Name: mensajes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mensajes (
    id integer NOT NULL,
    id_contrato integer,
    id_remitente integer NOT NULL,
    cuerpo text NOT NULL,
    enviado_en timestamp without time zone DEFAULT now() NOT NULL,
    leido_en timestamp without time zone,
    id_postulacion integer NOT NULL
);

--
-- Name: mensajes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.mensajes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: mensajes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.mensajes_id_seq OWNED BY public.mensajes.id;

--
-- Name: notificaciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notificaciones (
    id integer NOT NULL,
    id_usuario integer NOT NULL,
    tipo character varying(50) NOT NULL,
    datos jsonb,
    leido boolean DEFAULT false NOT NULL,
    creado_en timestamp without time zone DEFAULT now() NOT NULL
);

--
-- Name: notificaciones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notificaciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: notificaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notificaciones_id_seq OWNED BY public.notificaciones.id;

--
-- Name: postulaciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.postulaciones (
    id integer NOT NULL,
    id_trabajo integer NOT NULL,
    id_trabajador integer NOT NULL,
    precio_propuesto numeric(10,2),
    estado character varying(20) DEFAULT 'pendiente'::character varying NOT NULL,
    postulado_en timestamp without time zone DEFAULT now() NOT NULL,
    rechazo_automatico boolean DEFAULT false NOT NULL,
    reconfirmar_hasta timestamp without time zone,
    CONSTRAINT postulaciones_estado_check CHECK (((estado)::text = ANY ((ARRAY['pendiente'::character varying, 'aceptado'::character varying, 'rechazado'::character varying, 'retirado'::character varying, 'por_reconfirmar'::character varying])::text[])))
);

--
-- Name: postulaciones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.postulaciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: postulaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.postulaciones_id_seq OWNED BY public.postulaciones.id;

--
-- Name: provincias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.provincias (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL
);

--
-- Name: provincias_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.provincias_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: provincias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.provincias_id_seq OWNED BY public.provincias.id;

--
-- Name: resenas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resenas (
    id integer NOT NULL,
    id_contrato integer NOT NULL,
    id_autor integer NOT NULL,
    id_receptor integer NOT NULL,
    es_contratante boolean NOT NULL,
    calificacion smallint NOT NULL,
    comentario text,
    creado_en timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT resenas_calificacion_check CHECK (((calificacion >= 1) AND (calificacion <= 5)))
);

--
-- Name: resenas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.resenas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: resenas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.resenas_id_seq OWNED BY public.resenas.id;

--
-- Name: trabajos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trabajos (
    id integer NOT NULL,
    id_contratante integer NOT NULL,
    id_categoria integer NOT NULL,
    titulo character varying(255) NOT NULL,
    descripcion text,
    id_localidad integer,
    presupuesto numeric(10,2),
    estado character varying(20) DEFAULT 'abierto'::character varying NOT NULL,
    programado_para timestamp without time zone,
    creado_en timestamp without time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp without time zone DEFAULT now() NOT NULL,
    prioridad character varying(20) DEFAULT 'normal'::character varying NOT NULL,
    duracion character varying(50),
    direccion character varying(255),
    lat double precision,
    lng double precision
);

--
-- Name: trabajos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.trabajos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: trabajos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.trabajos_id_seq OWNED BY public.trabajos.id;

--
-- Name: usuario_categoria; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuario_categoria (
    id_usuario integer NOT NULL,
    id_categoria integer NOT NULL
);

--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    nombre_completo character varying(120) NOT NULL,
    email character varying(255) NOT NULL,
    telefono character varying(20),
    contrasena character varying(255),
    url_avatar character varying(500),
    biografia_trabajador text,
    id_localidad integer,
    prom_calif_trabajador numeric(3,2),
    prom_calif_contratante numeric(3,2),
    creado_en timestamp without time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp without time zone DEFAULT now() NOT NULL,
    ultimo_rol character varying(20) DEFAULT 'trabajador'::character varying NOT NULL,
    dni_frente_url character varying(500),
    dni_reverso_url character varying(500),
    verificado boolean DEFAULT false NOT NULL,
    biografia_contratante text,
    CONSTRAINT usuarios_rol_check CHECK (((ultimo_rol)::text = ANY ((ARRAY['contratador'::character varying, 'trabajador'::character varying])::text[])))
);

--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;

--
-- Name: categorias id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias ALTER COLUMN id SET DEFAULT nextval('public.categorias_id_seq'::regclass);

--
-- Name: contratos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos ALTER COLUMN id SET DEFAULT nextval('public.contratos_id_seq'::regclass);

--
-- Name: imagenes_trabajo id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imagenes_trabajo ALTER COLUMN id SET DEFAULT nextval('public.imagenes_trabajo_id_seq'::regclass);

--
-- Name: localidades id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.localidades ALTER COLUMN id SET DEFAULT nextval('public.localidades_id_seq'::regclass);

--
-- Name: mensajes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mensajes ALTER COLUMN id SET DEFAULT nextval('public.mensajes_id_seq'::regclass);

--
-- Name: notificaciones id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificaciones ALTER COLUMN id SET DEFAULT nextval('public.notificaciones_id_seq'::regclass);

--
-- Name: postulaciones id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.postulaciones ALTER COLUMN id SET DEFAULT nextval('public.postulaciones_id_seq'::regclass);

--
-- Name: provincias id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provincias ALTER COLUMN id SET DEFAULT nextval('public.provincias_id_seq'::regclass);

--
-- Name: resenas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resenas ALTER COLUMN id SET DEFAULT nextval('public.resenas_id_seq'::regclass);

--
-- Name: trabajos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trabajos ALTER COLUMN id SET DEFAULT nextval('public.trabajos_id_seq'::regclass);

--
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);

--
-- Name: categorias categorias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias
    ADD CONSTRAINT categorias_pkey PRIMARY KEY (id);

--
-- Name: contratos contratos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos
    ADD CONSTRAINT contratos_pkey PRIMARY KEY (id);

--
-- Name: imagenes_trabajo imagenes_trabajo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imagenes_trabajo
    ADD CONSTRAINT imagenes_trabajo_pkey PRIMARY KEY (id);

--
-- Name: localidades localidades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.localidades
    ADD CONSTRAINT localidades_pkey PRIMARY KEY (id);

--
-- Name: mensajes mensajes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mensajes
    ADD CONSTRAINT mensajes_pkey PRIMARY KEY (id);

--
-- Name: notificaciones notificaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificaciones
    ADD CONSTRAINT notificaciones_pkey PRIMARY KEY (id);

--
-- Name: postulaciones postulaciones_id_trabajo_id_trabajador_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.postulaciones
    ADD CONSTRAINT postulaciones_id_trabajo_id_trabajador_key UNIQUE (id_trabajo, id_trabajador);

--
-- Name: postulaciones postulaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.postulaciones
    ADD CONSTRAINT postulaciones_pkey PRIMARY KEY (id);

--
-- Name: provincias provincias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provincias
    ADD CONSTRAINT provincias_pkey PRIMARY KEY (id);

--
-- Name: resenas resenas_id_contrato_id_autor_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resenas
    ADD CONSTRAINT resenas_id_contrato_id_autor_key UNIQUE (id_contrato, id_autor);

--
-- Name: resenas resenas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resenas
    ADD CONSTRAINT resenas_pkey PRIMARY KEY (id);

--
-- Name: trabajos trabajos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trabajos
    ADD CONSTRAINT trabajos_pkey PRIMARY KEY (id);

--
-- Name: usuario_categoria usuario_categoria_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario_categoria
    ADD CONSTRAINT usuario_categoria_pkey PRIMARY KEY (id_usuario, id_categoria);

--
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);

--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);

--
-- Name: contratos_id_contratante_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contratos_id_contratante_idx ON public.contratos USING btree (id_contratante);

--
-- Name: contratos_id_trabajador_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contratos_id_trabajador_idx ON public.contratos USING btree (id_trabajador);

--
-- Name: mensajes_id_contrato_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX mensajes_id_contrato_idx ON public.mensajes USING btree (id_contrato);

--
-- Name: mensajes_id_postulacion_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX mensajes_id_postulacion_idx ON public.mensajes USING btree (id_postulacion);

--
-- Name: notificaciones_id_usuario_leido_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notificaciones_id_usuario_leido_idx ON public.notificaciones USING btree (id_usuario, leido);

--
-- Name: postulaciones_id_trabajador_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX postulaciones_id_trabajador_idx ON public.postulaciones USING btree (id_trabajador);

--
-- Name: trabajos_estado_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX trabajos_estado_idx ON public.trabajos USING btree (estado);

--
-- Name: trabajos_id_categoria_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX trabajos_id_categoria_idx ON public.trabajos USING btree (id_categoria);

--
-- Name: trabajos_id_contratante_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX trabajos_id_contratante_idx ON public.trabajos USING btree (id_contratante);

--
-- Name: contratos contratos_id_contratante_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos
    ADD CONSTRAINT contratos_id_contratante_fkey FOREIGN KEY (id_contratante) REFERENCES public.usuarios(id);

--
-- Name: contratos contratos_id_postulacion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos
    ADD CONSTRAINT contratos_id_postulacion_fkey FOREIGN KEY (id_postulacion) REFERENCES public.postulaciones(id);

--
-- Name: contratos contratos_id_trabajador_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos
    ADD CONSTRAINT contratos_id_trabajador_fkey FOREIGN KEY (id_trabajador) REFERENCES public.usuarios(id);

--
-- Name: contratos contratos_id_trabajo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos
    ADD CONSTRAINT contratos_id_trabajo_fkey FOREIGN KEY (id_trabajo) REFERENCES public.trabajos(id);

--
-- Name: imagenes_trabajo imagenes_trabajo_id_trabajo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imagenes_trabajo
    ADD CONSTRAINT imagenes_trabajo_id_trabajo_fkey FOREIGN KEY (id_trabajo) REFERENCES public.trabajos(id) ON DELETE CASCADE;

--
-- Name: localidades localidades_id_provincia_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.localidades
    ADD CONSTRAINT localidades_id_provincia_fkey FOREIGN KEY (id_provincia) REFERENCES public.provincias(id);

--
-- Name: mensajes mensajes_id_contrato_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mensajes
    ADD CONSTRAINT mensajes_id_contrato_fkey FOREIGN KEY (id_contrato) REFERENCES public.contratos(id);

--
-- Name: mensajes mensajes_id_postulacion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mensajes
    ADD CONSTRAINT mensajes_id_postulacion_fkey FOREIGN KEY (id_postulacion) REFERENCES public.postulaciones(id);

--
-- Name: mensajes mensajes_id_remitente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mensajes
    ADD CONSTRAINT mensajes_id_remitente_fkey FOREIGN KEY (id_remitente) REFERENCES public.usuarios(id);

--
-- Name: notificaciones notificaciones_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificaciones
    ADD CONSTRAINT notificaciones_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id);

--
-- Name: postulaciones postulaciones_id_trabajador_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.postulaciones
    ADD CONSTRAINT postulaciones_id_trabajador_fkey FOREIGN KEY (id_trabajador) REFERENCES public.usuarios(id);

--
-- Name: postulaciones postulaciones_id_trabajo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.postulaciones
    ADD CONSTRAINT postulaciones_id_trabajo_fkey FOREIGN KEY (id_trabajo) REFERENCES public.trabajos(id);

--
-- Name: resenas resenas_id_autor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resenas
    ADD CONSTRAINT resenas_id_autor_fkey FOREIGN KEY (id_autor) REFERENCES public.usuarios(id);

--
-- Name: resenas resenas_id_contrato_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resenas
    ADD CONSTRAINT resenas_id_contrato_fkey FOREIGN KEY (id_contrato) REFERENCES public.contratos(id);

--
-- Name: resenas resenas_id_receptor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resenas
    ADD CONSTRAINT resenas_id_receptor_fkey FOREIGN KEY (id_receptor) REFERENCES public.usuarios(id);

--
-- Name: trabajos trabajos_id_categoria_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trabajos
    ADD CONSTRAINT trabajos_id_categoria_fkey FOREIGN KEY (id_categoria) REFERENCES public.categorias(id);

--
-- Name: trabajos trabajos_id_contratante_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trabajos
    ADD CONSTRAINT trabajos_id_contratante_fkey FOREIGN KEY (id_contratante) REFERENCES public.usuarios(id);

--
-- Name: trabajos trabajos_id_localidad_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trabajos
    ADD CONSTRAINT trabajos_id_localidad_fkey FOREIGN KEY (id_localidad) REFERENCES public.localidades(id);

--
-- Name: usuario_categoria usuario_categoria_id_categoria_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario_categoria
    ADD CONSTRAINT usuario_categoria_id_categoria_fkey FOREIGN KEY (id_categoria) REFERENCES public.categorias(id) ON DELETE CASCADE;

--
-- Name: usuario_categoria usuario_categoria_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario_categoria
    ADD CONSTRAINT usuario_categoria_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id) ON DELETE CASCADE;

--
-- Name: usuarios usuarios_id_localidad_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_id_localidad_fkey FOREIGN KEY (id_localidad) REFERENCES public.localidades(id);

--
-- Name: categorias; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;

--
-- Name: contratos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;

--
-- Name: imagenes_trabajo; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.imagenes_trabajo ENABLE ROW LEVEL SECURITY;

--
-- Name: localidades; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.localidades ENABLE ROW LEVEL SECURITY;

--
-- Name: mensajes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.mensajes ENABLE ROW LEVEL SECURITY;

--
-- Name: notificaciones; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;

--
-- Name: postulaciones; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.postulaciones ENABLE ROW LEVEL SECURITY;

--
-- Name: provincias; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.provincias ENABLE ROW LEVEL SECURITY;

--
-- Name: categorias public read categorias; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public read categorias" ON public.categorias FOR SELECT USING (true);

--
-- Name: localidades public read localidades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public read localidades" ON public.localidades FOR SELECT USING (true);

--
-- Name: provincias public read provincias; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public read provincias" ON public.provincias FOR SELECT USING (true);

--
-- Name: resenas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.resenas ENABLE ROW LEVEL SECURITY;

--
-- Name: trabajos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.trabajos ENABLE ROW LEVEL SECURITY;

--
-- Name: usuarios; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

