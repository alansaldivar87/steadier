const concepts = [
  ['mortgage', 'hipoteca', 'hipotecario', 'vivienda', 'housing', 'house', 'casa'],
  ['forbearance', 'prorroga', 'pausa', 'aplazamiento'],
  ['foreclosure', 'ejecucion', 'subasta', 'desalojo'],
  ['debt', 'deuda', 'deudas', 'owe'],
  ['loan', 'prestamo', 'prestamos'],
  ['balance', 'saldo', 'saldos'],
  ['statement', 'estado', 'extracto'],
  ['payment', 'payments', 'pago', 'pagos', 'repayment'],
  ['overdue', 'late', 'atrasado', 'vencido', 'moroso'],
  ['deadline', 'plazo', 'vencimiento'],
  ['interest', 'interes', 'apr', 'tasa'],
  ['fee', 'fees', 'cargo', 'cargos', 'comision'],
  ['income', 'ingreso', 'ingresos', 'salary', 'sueldo', 'nomina'],
  ['payday', 'quincena', 'cobrar'],
  ['groceries', 'supermercado', 'despensa', 'comida'],
  ['fuel', 'gasolina'],
  ['transfer', 'transferencia', 'traspaso'],
  ['advance', 'adelanto', 'anticipo'],
  ['savings', 'ahorro', 'ahorros'],
  ['budget', 'presupuesto'],
  ['credit', 'credito', 'tarjeta'],
];
export function expandQuery(query: string) {
  const words = new Set(
    query
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .match(/[a-z0-9]+/g) || [],
  );
  for (const concept of concepts)
    if (concept.some((word) => words.has(word))) concept.forEach((word) => words.add(word));
  return [...words].join(' ');
}
