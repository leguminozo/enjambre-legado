import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const empresaId = "temp-empresa-id";

    // Upsert Empresa
    const empresa = await prisma.empresa.upsert({
        where: { id: empresaId },
        update: {},
        create: {
            id: empresaId,
            razonSocial: "Empresa de Prueba EIRL",
            rut: "76.123.456-7",
            giro: "Desarrollo de Software",
            direccion: "Calle Falsa 123",
            comuna: "Providencia",
            ciudad: "Santiago",
            region: "Metropolitana",
            capitalInicial: 1000000,
            fechaConstitucion: new Date(),
            tipoActividad: "Profesional",
            email: "contacto@empresa.cl"
        },
    });

    console.log({ empresa });

    // Create current period
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();

    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0);

    const periodo = await prisma.periodoContable.upsert({
        where: {
            empresaId_mes_anio: {
                empresaId,
                mes: currentMonth,
                anio: currentYear
            }
        },
        update: {},
        create: {
            empresaId,
            nombre: `Periodo Actual ${currentMonth}/${currentYear}`,
            mes: currentMonth,
            anio: currentYear,
            fechaInicio: startDate,
            fechaTermino: endDate,
            estado: "Abierto",
        }
    });

    console.log({ periodo });

    // Add some dummy Facturas
    await prisma.facturaEmitida.create({
        data: {
            numero: "101",
            fecha: new Date(),
            montoTotal: 1190000,
            montoNeto: 1000000,
            montoIva: 190000,
            estado: "Pagada",
            tipoDocumento: "Factura Electrónica",
            empresaId,
            periodoId: periodo.id,
            descripcion: "Servicios de Consultoría"
        }
    });

    await prisma.facturaEmitida.create({
        data: {
            numero: "102",
            fecha: new Date(),
            montoTotal: 595000,
            montoNeto: 500000,
            montoIva: 95000,
            estado: "Pendiente",
            tipoDocumento: "Factura Electrónica",
            empresaId,
            periodoId: periodo.id,
            descripcion: "Desarrollo Web"
        }
    });

    // Add some dummy Gastos
    await prisma.gasto.create({
        data: {
            fecha: new Date(),
            descripcion: "Servidor Cloud",
            monto: 50000,
            montoNeto: 50000, // Exento o intl
            montoIva: 0,
            categoria: "Servicios Básicos",
            tipoComprobante: "Invoice",
            estado: "Pagado",
            empresaId,
            periodoId: periodo.id
        }
    });

    await prisma.gasto.create({
        data: {
            fecha: new Date(),
            descripcion: "Insumos Oficina",
            monto: 23800,
            montoNeto: 20000,
            montoIva: 3800,
            categoria: "Suministros",
            tipoComprobante: "Boleta",
            estado: "Pagado",
            empresaId,
            periodoId: periodo.id
        }
    });

    // Add dummy PPM (Impuesto)
    await prisma.impuesto.create({
        data: {
            tipo: "PPM",
            periodo: "Mensual",
            mes: currentMonth,
            anio: currentYear,
            montoDeclarado: 0,
            montoCalculadoIA: 15450, // Ejemplo
            estado: "Pendiente",
            empresaId
        }
    });

    // Add dummy CalculoIA
    await prisma.calculoIA.create({
        data: {
            tipo: "ImpuestoMensual",
            parametros: JSON.stringify({ mes: currentMonth, anio: currentYear }),
            resultado: JSON.stringify({ ivaPagar: 125000, ppm: 15450 }),
            confianza: 0.98,
            prompt: "Calcula impuestos mes actual",
            respuestaIA: "Basado en tus facturas, el IVA a pagar es $125.000 y PPM sugerido $15.450.",
            estado: "Completado",
            empresaId
        }
    });

    console.log("Seeding finished.");
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
