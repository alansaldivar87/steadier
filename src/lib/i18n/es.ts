// English source phrases are stable message keys. User-entered text is never translated here.
const pairs = `
Sources consulted (|Fuentes consultadas (
Receipt and document reader|Lector de recibos y documentos
Use Gemini from Google AI Studio for photos and scanned PDFs, independently of your chat assistant.|Usa Gemini de Google AI Studio para fotos y PDF escaneados, independientemente de tu asistente de chat.
Get your Google AI Studio API key|Obtener tu clave API de Google AI Studio
Document reader connected. Upload a receipt or statement to begin.|Lector de documentos conectado. Sube un recibo o estado de cuenta para empezar.
Choose a model available from this provider.|Elige un modelo disponible de este proveedor.
Sign in with an approved household Google account.|Inicia sesión con una cuenta de Google autorizada del hogar.
Open the app and try this action again.|Abre la app e intenta esta acción de nuevo.
This entry is too long.|Este registro es demasiado largo.
Something went wrong. Please try again.|Algo salió mal. Inténtalo de nuevo.
This item has already been saved. Refresh to see it.|Este elemento ya se guardó. Actualiza para verlo.
Some fields are missing or invalid. Check the dates, amounts, and selected accounts.|Faltan datos o algunos no son válidos. Revisa las fechas, los montos y las cuentas elegidas.
This item changed. Refresh and try again.|Este elemento cambió. Actualiza e inténtalo de nuevo.
Item no longer exists.|El elemento ya no existe.
Choose an existing account.|Elige una cuenta existente.
This transaction predates the account opening balance. Adjust the opening date and balance first.|Este movimiento es anterior al saldo inicial de la cuenta. Primero ajusta la fecha y el saldo inicial.
Choose a valid destination account with an earlier opening date.|Elige una cuenta de destino válida con una fecha inicial anterior.
This transaction is linked to a paid calendar item. Reopen that calendar payment before changing the transaction.|Este movimiento está vinculado a un pago del calendario. Vuelve a marcar ese pago como pendiente antes de cambiar el movimiento.
Record or reopen payments from the calendar.|Registra los pagos o vuélvelos a marcar como pendientes desde el calendario.
Choose an account and a statement date on or after its opening date.|Elige una cuenta y una fecha de estado de cuenta igual o posterior a la fecha inicial.
This category already has a budget for that month. Edit the existing limit.|Esta categoría ya tiene un presupuesto para ese mes. Edita el límite existente.
The opening date cannot exclude existing transactions.|La fecha inicial no puede dejar fuera movimientos existentes.
This account has transactions or calendar items. Remove or reassign those first.|Esta cuenta tiene movimientos o pagos del calendario. Primero elimínalos o asígnalos a otra cuenta.
This item cannot be deleted here.|Este elemento no se puede eliminar aquí.
Reopen the linked calendar payment before removing its transaction.|Vuelve a marcar el pago vinculado como pendiente antes de eliminar su movimiento.
This draft changed. Refresh and try again.|Este borrador cambió. Actualiza e inténtalo de nuevo.
This item was already reviewed.|Este elemento ya se revisó.
Keep the original source reference.|Conserva la referencia al documento original.
Possible duplicate: this account already has a transaction for the same date and amount. Dismiss this draft if it is the same purchase, or explicitly save as a separate purchase.|Posible duplicado: esta cuenta ya tiene un movimiento con la misma fecha y monto. Descarta el borrador si es la misma compra o confirma que es una compra distinta.
Only a debt, account, or preference draft can update an existing record.|Solo un borrador de deuda, cuenta o preferencia puede actualizar un registro existente.
Choose an existing record of the same type.|Elige un registro existente del mismo tipo.
This calendar item changed. Refresh and try again.|Este elemento del calendario cambió. Actualiza e inténtalo de nuevo.
This occurrence is already paid or is not on the schedule.|Este pago ya está registrado o no está en el calendario.
Choose a recorded payment with the matching amount, account, and direction.|Elige un pago registrado con el mismo monto, cuenta y dirección del dinero.
This transaction is already linked to a calendar payment.|Este movimiento ya está vinculado a un pago del calendario.
A bill payment must be money going out.|Un pago de cuenta debe ser dinero que sale.
Calendar payment reopened. The transaction is still recorded; edit or remove it separately if needed.|El pago del calendario volvió a pendiente. El movimiento sigue registrado; edítalo o elimínalo por separado si hace falta.
Choose a file smaller than 4 MB.|Elige un archivo de menos de 4 MB.
Choose a file smaller than 4 MB. Split large statements into smaller PDFs.|Elige un archivo de menos de 4 MB. Divide los estados grandes en PDF más pequeños.
Choose a document or photo.|Elige un documento o una foto.
This file is not plain text.|Este archivo no es de texto simple.
Use a JPEG, PNG, WebP, PDF, CSV, or text file. On iPhone, choose a photo or take one with the camera.|Usa un archivo JPEG, PNG, WebP, PDF, CSV o de texto. En iPhone, elige una foto o toma una con la cámara.
Choose an existing account for this statement.|Elige una cuenta existente para este estado de cuenta.
Document not found.|No se encontró el documento.
This document is already being read. Check back shortly.|Este documento ya se está leyendo. Revisa en un momento.
This document is too long for one review. Split it into smaller files; no rows have been imported.|Este documento es demasiado largo para una revisión. Divídelo en archivos más pequeños; no se importó ninguna fila.
This document changed while processing. Retry.|Este documento cambió mientras se procesaba. Inténtalo de nuevo.
Could not read this file.|No se pudo leer este archivo.
This CSV has more than 500 rows. Split it into smaller files.|Este CSV tiene más de 500 filas. Divídelo en archivos más pequeños.
No transaction rows were found.|No se encontraron filas de movimientos.
Use Amount (negative for money out), or separate Debit and Credit columns.|Usa la columna Amount (negativo para salidas) o las columnas Debit y Credit por separado.
Invalid file reference.|Referencia de archivo no válida.
Connect private file storage before uploading on Vercel.|Conecta el almacenamiento privado antes de subir archivos en Vercel.
File could not be read.|No se pudo leer el archivo.
Actual payment / receipt date|Fecha en que realmente se pagó / recibió
Choose your AI assistant|Elige tu asistente de IA
Switch providers or models here any time. Both household members use this connection.|Cambia de proveedor o modelo cuando quieras. Ambos integrantes del hogar usan esta conexión.
AI provider|Proveedor de IA
API key connected · leave blank to keep it|Clave API conectada · deja en blanco para conservarla
API key|Clave API
Enter only to replace the key|Escribe solo si quieres cambiar la clave
Paste the provider key here|Pega aquí la clave del proveedor
Saved on the server. Never included in exports or sent back to the browser.|Se guarda en el servidor. Nunca se incluye en las exportaciones ni se devuelve al navegador.
Working…|Procesando…
Load available models|Cargar modelos disponibles
Filter models|Filtrar modelos
Search by model name, such as Grok|Buscar por nombre de modelo, como Grok
Model for conversations and actions|Modelo para conversaciones y acciones
Choose a model|Elegir un modelo
Catalog price per million tokens: {input} input / {output} output.|Precio del catálogo por millón de tokens: {input} de entrada / {output} de salida.
Pricing is available from your provider.|Consulta los precios con tu proveedor.
Model for photos and documents|Modelo para fotos y documentos
Use the conversation model|Usar el modelo de conversación
Photos require an image-capable model. Scanned PDFs require native PDF support; otherwise upload page photos.|Las fotos necesitan un modelo que pueda ver imágenes. Los PDF escaneados requieren compatibilidad directa con PDF; si no, sube fotos de las páginas.
Daily AI call limit|Límite diario de consultas de IA
One conversation can use up to four calls. Set a dollar spending cap with your provider too.|Una respuesta puede usar hasta cuatro consultas. Configura también un tope de gasto en dólares con tu proveedor.
AI connection saved. You can use the coach now.|Conexión de IA guardada. Ya puedes usar el asistente.
Save AI connection|Guardar conexión de IA
Add an API key to load this provider’s models.|Agrega una clave API para cargar los modelos de este proveedor.
Could not load models. Check the provider key and try again.|No se pudieron cargar los modelos. Revisa la clave e inténtalo de nuevo.
Add an API key before connecting this provider.|Agrega una clave API antes de conectar este proveedor.
Choose models available from this provider. The coach needs tool calling.|Elige modelos disponibles de este proveedor. El asistente necesita un modelo que pueda usar herramientas.
Set a session secret before saving an AI key.|Configura el secreto de sesión antes de guardar una clave de IA.
Reconnect this provider after changing the session secret.|Vuelve a conectar este proveedor después de cambiar el secreto de sesión.
Today|Hoy
Our money|Nuestro dinero
Our plan|Nuestro plan
Documents|Documentos
Money coach|Asistente financiero
Household|Hogar
Our household|Nuestro hogar
Please try again.|Inténtalo de nuevo.
Document is ready for review.|El documento está listo para revisar.
This document is already here.|Este documento ya está aquí.
Document saved. Reading it now…|Documento guardado. Leyéndolo…
Could not upload.|No se pudo subir el archivo.
Gathering our household…|Cargando los datos del hogar…
Try again|Intentar de nuevo
Let’s take the next step.|Demos el siguiente paso.
A clearer picture starts here.|Aquí empezamos a ver las cosas claras.
Every dollar has a place.|Cada dólar tiene su lugar.
A plan we can actually follow.|Un plan que sí podemos seguir.
Bring it all together.|Reunamos todo aquí.
Talk it through.|Vamos a hablarlo.
Our household, our way.|Nuestro hogar, a nuestra manera.
Bring your money into one place. We’ll work through it together.|Reúne tu dinero en un solo lugar. Lo resolveremos paso a paso.
Accounts, spending, and debt. Nothing to remember in your head.|Cuentas, gastos y deudas. Sin tener que recordarlo todo.
See what is coming. Protect the essentials. Make room for progress.|Mira lo que viene. Protege lo esencial. Haz espacio para avanzar.
A photo or a statement is enough to get started.|Una foto o un estado de cuenta basta para empezar.
Ask a question, describe a purchase, or work through one difficult bill.|Haz una pregunta, describe una compra o revisa un pago que te preocupe.
Keep your shared information and preferences up to date.|Mantengan al día la información y las preferencias del hogar.
A little clearer, together.|Juntos, todo un poco más claro.
ONE STEP AT A TIME|UN PASO A LA VEZ
You don’t have to figure it all out today.|No tienes que resolverlo todo hoy.
Local workspace|Espacio local
Google connection pending|Falta conectar Google
Household member|Integrante del hogar
Sign out|Cerrar sesión
Shared household|Hogar compartido
Refresh household|Actualizar datos del hogar
Up to date.|Todo actualizado.
Dismiss|Cerrar
LET’S MAKE ROOM TO BREATHE|HAGAMOS ESPACIO PARA RESPIRAR
A LITTLE HELP, WITHOUT THE JUDGMENT|UN POCO DE AYUDA, SIN JUZGAR
ONE HOUSEHOLD. ONE CLEARER PICTURE.|UN HOGAR. TODO MÁS CLARO.
Add something|Agregar algo
YOUR NEXT SMALL STEP|TU SIGUIENTE PEQUEÑO PASO
Give your home|Dale a tu casa
the first bit of attention.|la primera atención.
Start with the account|Empieza con la cuenta
that pays your bills.|con la que pagas tus gastos.
Let’s fill in|Completemos
the next piece.|la siguiente parte.
Your money plan,|Tu plan financiero,
one day at a time.|un día a la vez.
Keep your latest notice, servicer contact, and agreement deadline together.|Reúne el último aviso, el contacto de tu administrador hipotecario y el plazo del acuerdo.
Add its opening balance, then your next payday. That gives us a starting point.|Agrega el saldo inicial y tu próximo día de pago. Así tendremos por dónde empezar.
Your next 30 days are mapped out from the records you’ve confirmed.|Tus próximos 30 días están calculados con los registros que confirmaste.
Open our housing steps|Ver los pasos para nuestra vivienda
Add our first account|Agregar nuestra primera cuenta
Continue our setup|Continuar la configuración
Look at our plan|Ver nuestro plan
Find our footing|Saber dónde estamos
Make a plan|Hacer un plan
Build breathing room|Crear un colchón
Spent something?|¿Hiciste un gasto?
Just capture it.|Solo regístralo.
A photo, a statement, or a quick message. Start wherever is easiest.|Una foto, un estado de cuenta o un mensaje corto. Empieza como te resulte más fácil.
Saving photo…|Guardando foto…
Take a photo|Tomar una foto
Upload a statement|Subir un estado de cuenta
Or type it in|O escribirlo
Cash we can use|Dinero que podemos usar
Let’s find out|Vamos a averiguarlo
From confirmed cash accounts|De las cuentas de efectivo confirmadas
Add checking and savings balances|Agrega los saldos de cheques y ahorros
Available to plan · next 30 days|Disponible para planear · próximos 30 días
Still gathering the picture|Aún estamos reuniendo información
Confirm the missing pieces first|Primero confirma lo que falta
After listed payments and our buffer|Después de los pagos anotados y nuestro colchón
Our total debt|Nuestra deuda total
One at a time|Una a la vez
Latest recorded debt balances|Últimos saldos de deuda registrados
Start with the most urgent account|Empieza con la cuenta más urgente
Coming up next|Lo que viene
Our calendar|Nuestro calendario
Money coming in|Dinero que entra
Set this money aside|Aparta este dinero
No surprises, once we add them.|Menos sorpresas al anotarlo todo.
Add your next payday and the bills due before it.|Agrega tu próximo día de pago y las cuentas que vencen antes.
Add a bill or payday|Agregar un pago o ingreso
HOUSING FIRST|PRIMERO LA VIVIENDA
First, protect the essentials.|Primero, protege lo esencial.
If a housing payment is overdue, contact your servicer now. Keep their deadlines and next steps here.|Si tienes un pago de vivienda atrasado, contacta hoy al administrador de tu préstamo. Guarda aquí los plazos y los siguientes pasos.
Contact mortgage servicer about repayment options|Contactar al administrador hipotecario sobre opciones de pago
Add a housing step|Agregar un paso para la vivienda
Find a U.S. housing counselor|Buscar asesor de vivienda en EE. UU.
new items to check|elementos nuevos por revisar
Review imports|Revisar importaciones
Help the coach turn receipts and statements into reliable records.|Ayuda al asistente a convertir recibos y estados de cuenta en registros confiables.
Progress, not perfection. Every dollar you add makes the picture clearer.|Buscamos avanzar, no la perfección. Cada dólar que registras aclara el panorama.
What would you like to add?|¿Qué te gustaría agregar?
Money spent or received|Dinero gastado o recibido
A quick entry for everyday money.|Un registro rápido del dinero de cada día.
An account|Una cuenta
Checking, savings, cash, or a credit card.|Cheques, ahorros, efectivo o tarjeta de crédito.
A bill or payday|Un pago o día de cobro
What’s coming in or going out.|Lo que va a entrar o salir.
A debt|Una deuda
Mortgage, card, loan, or cash advance.|Hipoteca, tarjeta, préstamo o adelanto de efectivo.
A next step|Un siguiente paso
A call, a deadline, or something to follow up.|Una llamada, una fecha límite o algo por resolver.
Something to remember|Algo para recordar
A preference or household goal.|Una preferencia o meta del hogar.
Check this before saving|Revisa esto antes de guardar
Update this entry|Actualizar este registro
Add|Agregar
Open original document ↗|Abrir documento original ↗
Confirm and save|Confirmar y guardar
Save entry|Guardar registro
Does this update something already here?|¿Esto actualiza algo que ya está aquí?
Create a new record|Crear un registro nuevo
Choose the existing debt for a newer statement so the balance is updated instead of counted twice.|Si es un estado de cuenta nuevo, elige la deuda existente para actualizar el saldo sin contarlo dos veces.
This is a separate entry even if the date and amount match an existing entry.|Es un registro distinto aunque coincidan la fecha y el monto con otro registro.
Draft dismissed.|Borrador descartado.
Dismiss this draft / already recorded|Descartar este borrador / ya está registrado
Saved to our household.|Guardado en nuestro hogar.
Remove this entry?|¿Eliminar este registro?
Remove “|¿Eliminar «
” from the active records? The change remains in the audit history.|» de los registros activos? El cambio queda en el historial de auditoría.
Keep it|Conservar
Entry removed.|Registro eliminado.
Remove entry|Eliminar registro
Close dialog|Cerrar ventana
Our monthly spending plan ·|Nuestro plan de gastos del mes ·
Set a category limit|Fijar un límite por categoría
Earned|Ganado
Everyday spending, less refunds|Gastos diarios, menos reembolsos
Borrowed|Prestado
of|de
remaining|restantes
over our planned limit|por encima de nuestro límite
Give everyday spending a simple limit.|Pon un límite sencillo a los gastos diarios.
Start with groceries, fuel, and eating out. You can adjust the plan as you learn.|Empieza con supermercado, gasolina y comidas fuera. Puedes ajustar el plan mientras aprendes.
Category limits track spending; they do not automatically reserve cash. Put expected essentials on the calendar too. Transfers and loan repayments are shown separately from everyday spending.|Los límites por categoría ayudan a seguir los gastos; no apartan dinero automáticamente. Agrega también los gastos esenciales al calendario. Las transferencias y los pagos de préstamos se muestran separados de los gastos diarios.
Check our statement balances|Comprobar nuestros saldos
Compare a statement|Comparar un estado de cuenta
Account removed|Cuenta eliminada
Statement:|Estado de cuenta:
· Ledger:|· Registro:
Unknown|Desconocido
Account missing|Falta la cuenta
Matches to the cent|Coincide hasta el último centavo
Statement check|Revisión de estado de cuenta
Compare the closing balance on a statement with the ledger. A difference may mean missing purchases, duplicate entries, or an incorrect opening balance. We keep the difference visible until it is resolved.|Compara el saldo final del estado de cuenta con tus registros. Una diferencia puede indicar compras faltantes, duplicados o un saldo inicial incorrecto. La diferencia seguirá visible hasta resolverla.
Our breathing-room goals|Nuestras metas de ahorro
Add a savings goal|Agregar una meta de ahorro
set aside toward|apartados de una meta de
· By|· Para el
A little breathing room is a goal, too.|Tener un pequeño colchón también es una meta.
Track a cash cushion or another savings goal once urgent obligations are covered.|Lleva el seguimiento de un colchón de efectivo u otra meta cuando cubras los pagos urgentes.
Goal balances are amounts you report as set aside. They do not move money or automatically increase your protected cash buffer.|Los saldos de las metas son cantidades que tú indicas haber apartado. No mueven dinero ni aumentan automáticamente tu colchón protegido.
Our accounts|Nuestras cuentas
Add account|Agregar cuenta
Starting|Desde
Start with just one account.|Empieza con una sola cuenta.
Use its opening statement balance if you’ll import past transactions.|Usa el saldo inicial del estado de cuenta si vas a importar movimientos anteriores.
Money in and out|Dinero que entra y sale
Add entry|Agregar registro
Find transactions|Buscar movimientos
Find a purchase, account, or category|Buscar una compra, cuenta o categoría
A receipt, a quick entry, a little more clarity.|Un recibo, un registro rápido y un poco más de claridad.
Your reviewed purchases and income will appear here.|Tus compras e ingresos revisados aparecerán aquí.
Borrowed money is tracked separately from earnings. A transfer to pay a credit card does not count as a second purchase.|El dinero prestado se registra separado de los ingresos. Una transferencia para pagar una tarjeta no cuenta como otra compra.
Everything we owe|Todo lo que debemos
Add debt|Agregar deuda
Interest rate unknown|Tasa de interés desconocida
minimum|mínimo
Balance as of|Saldo al
· Due|· Vence el
· Automatic withdrawal|· Retiro automático
past due|atrasados
You don’t have to add them all today.|No tienes que agregarlas todas hoy.
Start with your mortgage, then add one card or loan at a time.|Empieza con tu hipoteca y luego agrega una tarjeta o préstamo a la vez.
Debt balances are statement snapshots. Update them when a new statement arrives; a payment may include interest and fees.|Los saldos de deuda reflejan un estado de cuenta. Actualízalos al recibir uno nuevo; un pago puede incluir intereses y cargos.
Housing and next steps|Vivienda y próximos pasos
Add step|Agregar paso
For an overdue U.S. mortgage, contact your servicer’s assistance team promptly. If you have a sale date or legal papers, seek a HUD-approved counselor and local legal help now.|Si tu hipoteca en EE. UU. está atrasada, contacta pronto al equipo de asistencia del administrador. Si tienes fecha de subasta o documentos legales, busca hoy un asesor aprobado por HUD y ayuda legal local.
CFPB guidance ↗|Orientación de CFPB ↗
Mark incomplete|Marcar como pendiente
Mark complete|Marcar como completado
Due|Vence el
No date set|Sin fecha
· Urgent|· Urgente
Call the mortgage servicer’s assistance team|Llamar al equipo de asistencia del administrador hipotecario
Ask for the exact overdue amount, available repayment options, required documents, and application deadline. Ask for all proposed terms in writing.|Pregunta el monto exacto atrasado, las opciones de pago, los documentos necesarios y la fecha límite. Pide todas las condiciones propuestas por escrito.
1. Add our servicer call|1. Agregar la llamada al administrador
2. Upload the latest housing notice|2. Subir el último aviso de vivienda
3. Prepare the call together|3. Preparar la llamada juntos
The next 30 days|Los próximos 30 días
Based on our listed payments|Según los pagos que anotamos
First, add a cash account.|Primero, agrega una cuenta de efectivo.
Then we can show how upcoming paydays and bills affect your balance.|Después podremos mostrar cómo los próximos ingresos y pagos afectan tu saldo.
What’s missing from our picture? (|¿Qué nos falta por saber? (
An estimate, not a guarantee. Include groceries, fuel, debt minimums, and automatic withdrawals. Outflows are counted before income on the same date.|Es una estimación, no una garantía. Incluye supermercado, gasolina, pagos mínimos y retiros automáticos. En una misma fecha contamos las salidas antes que los ingresos.
Bills, paydays & automatic withdrawals|Cuentas, ingresos y retiros automáticos
Add to calendar|Agregar al calendario
No unpaid occurrence in this window|Sin pagos pendientes en este período
No account chosen|Sin cuenta elegida
Received|Recibido
Paid|Pagado
Payment history (|Historial de pagos (
Reopen|Volver a pendiente
What happens before the next payday?|¿Qué vence antes de volver a cobrar?
Add income, housing, utilities, food, and debt withdrawals. Estimates for variable bills are okay; update them when you know.|Agrega ingresos, vivienda, servicios, comida y retiros de deuda. Puedes estimar los pagos variables y actualizarlos cuando sepas el monto.
Compare ways to pay down debt|Comparar formas de salir de deudas
PLANNING ESTIMATE|ESTIMACIÓN PARA PLANEAR
After essentials and agreed payments are covered, compare the effect of an extra monthly amount.|Una vez cubiertos los gastos esenciales y los pagos acordados, compara qué cambia con un pago extra mensual.
Extra per month ($)|Extra por mes ($)
Highest interest first|Primero el interés más alto
Smallest balance first|Primero el saldo más pequeño
Enter a positive dollar amount or zero.|Escribe un monto positivo o cero.
months|meses
estimated interest|de intereses estimados
total monthly debt payment|de pago total mensual de deudas
Assumes fixed rates, monthly interest, constant total payments, no new borrowing or fees. This comparison does not establish affordability.|Supone tasas fijas, interés mensual, pagos totales constantes y ninguna deuda o cargo nuevo. Esta comparación no confirma que puedas costear el pago.
Record this payday|Registrar este ingreso
Record this payment|Registrar este pago
Calendar and account updated together.|Calendario y cuenta actualizados juntos.
Check this payment.|Revisa este pago.
Account used|Cuenta utilizada
Choose account|Elegir cuenta
Already recorded in our transactions?|¿Ya está en nuestros movimientos?
No, create the transaction now|No, crear el movimiento ahora
Choose an existing entry if you already imported or entered this payment.|Elige un registro existente si ya importaste o anotaste este pago.
Payment type|Tipo de pago
Everyday bill payment|Pago de un gasto diario
Loan / mortgage / advance repayment|Pago de préstamo / hipoteca / adelanto
Transfer to a tracked credit card|Transferencia a una tarjeta registrada
Credit card receiving the payment|Tarjeta de crédito que recibe el pago
Choose destination|Elegir destino
Saving…|Guardando…
Link payment and update calendar|Vincular pago y actualizar calendario
Record and update calendar|Registrar y actualizar calendario
No spreadsheet homework.|Sin tareas de hojas de cálculo.
Take a clear photo or upload a statement. We’ll pull out the details for you to check.|Toma una foto clara o sube un estado de cuenta. Extraeremos los detalles para que los revises.
Account for this statement (optional)|Cuenta de este estado de cuenta (opcional)
Choose during review|Elegir al revisar
JPEG, PNG, WebP, PDF, CSV or text · up to 4 MB each|JPEG, PNG, WebP, PDF, CSV o texto · hasta 4 MB cada uno
Uploading…|Subiendo…
Choose a file|Elegir un archivo
AI reading is waiting for a provider connection. CSV import and manual entry already work. Your uploaded documents remain saved.|Falta conectar la IA para leer documentos. Ya puedes importar CSV y registrar datos manualmente. Tus documentos subidos quedan guardados.
Ready for a quick check|Listo para una revisión rápida
to review|por revisar
New entry|Nuevo registro
Review|Revisar
All caught up.|Todo al día.
New receipts and statements will appear here for review.|Los recibos y estados de cuenta nuevos aparecerán aquí para revisarlos.
Our document shelf|Nuestros documentos
files|archivos
Reviewed|Revisado
Ready to review|Listo para revisar
Reading|Leyendo
Needs another try|Requiere otro intento
Saved|Guardado
Reading…|Leyendo…
Read document|Leer documento
Start with the most urgent document.|Empieza con el documento más urgente.
The latest housing notice or bank statement is a good first step.|El último aviso de vivienda o estado de cuenta bancario es un buen comienzo.
Search our documents|Buscar en nuestros documentos
Find terms, fees, or a lender in our documents|Buscar condiciones, cargos o un prestamista
Search|Buscar
Open source ↗|Abrir fuente ↗
Bring things in, a little at a time|Agrega las cosas poco a poco
Start with what’s urgent|Empieza por lo urgente
Mortgage notice, forbearance agreement, collection or repayment deadlines.|Aviso hipotecario, acuerdo de pausa de pagos o plazos de cobranza o pago.
Find the cash|Ubica el dinero
Bank balances, your take-home pay, your wife’s take-home pay, and pay dates.|Saldos bancarios, ingresos netos de ambos y fechas de cobro.
See the whole picture|Mira el panorama completo
Three months of bank/card statements, loan balances, and every cash advance app.|Tres meses de estados bancarios y tarjetas, saldos de préstamos y todas las apps de adelantos.
Your money coach|Tu asistente financiero
Uses our confirmed records and source documents|Consulta nuestros registros confirmados y documentos
AI connection pending · manual tracking is ready|Falta conectar la IA · el registro manual ya funciona
Let’s start where you are.|Empecemos donde estás.
No judgment. Tell me what’s on your mind, or choose one small step.|Sin juzgarte. Cuéntame qué te preocupa o elige un pequeño paso.
What needs attention before our next payday?|¿Qué debemos atender antes de volver a cobrar?
Help me get our mortgage situation organized.|Ayúdame a organizar la situación de nuestra hipoteca.
I spent $42.50 on groceries. Help me record it.|Gasté $42.50 en supermercado. Ayúdame a registrarlo.
What information are we still missing?|¿Qué información nos falta?
You|Tú
Sources used (|Fuentes consultadas (
Looking through our records…|Revisando nuestros registros…
Message the money coach|Escribir al asistente financiero
Ask anything about our money…|Pregunta lo que quieras sobre nuestro dinero…
Send message|Enviar mensaje
Suggestions become review drafts. You decide what gets saved.|Las sugerencias se convierten en borradores. Tú decides qué se guarda.
Our shared context|Nuestra información compartida
accounts ·|cuentas ·
debts|deudas
documents ·|documentos ·
remembered preferences|preferencias guardadas
Add something to remember|Agregar algo para recordar
suggestions to check|sugerencias por revisar
The coach has proposed entries for your review.|El asistente propuso registros para que los revises.
Review suggestions|Revisar sugerencias
One useful rule|Una regla útil
If something is unclear, we ask. Missing numbers stay unknown until you confirm them.|Si algo no está claro, preguntamos. Los montos faltantes siguen sin conocerse hasta que los confirmes.
Let’s confirm our starting point.|Confirmemos nuestro punto de partida.
Check each item only when the list is complete. Until then, the app won’t suggest money available for extra spending.|Marca cada opción solo cuando la lista esté completa. Hasta entonces, la app no sugerirá dinero disponible para gastos extra.
Household updated.|Hogar actualizado.
Household name|Nombre del hogar
Cash buffer to protect ($)|Colchón de efectivo a proteger ($)
Money you want to keep untouched.|Dinero que quieres dejar sin tocar.
Country|País
State / province|Estado / provincia
Time zone|Zona horaria
All our cash accounts and opening balances are here.|Todas nuestras cuentas de efectivo y saldos iniciales están aquí.
All expected take-home pay and pay dates are on the calendar.|Todos los ingresos netos esperados y fechas de cobro están en el calendario.
All bills, debt payments, cash advance withdrawals, and everyday essentials are on the calendar.|Todas las cuentas, pagos de deuda, retiros de adelantos y gastos esenciales están en el calendario.
Save household setup|Guardar configuración del hogar
What our coach remembers|Lo que recuerda nuestro asistente
Add preference|Agregar preferencia
Start with your goals, the categories you use, or what matters to your household.|Empieza con tus metas, las categorías que usas o lo que le importa a tu hogar.
Connections & portability|Conexiones y exportación
Google accounts|Cuentas de Google
Connection pending|Conexión pendiente
Connected|Conectado
AI coach|Asistente de IA
File storage|Almacenamiento de archivos
AI calls today|Consultas de IA hoy
The daily call cap is a usage brake, not an exact dollar limit. Set a spending cap with your AI provider too.|El límite diario de consultas controla el uso, pero no es un límite exacto en dólares. Configura también un tope de gasto con tu proveedor de IA.
Export our records|Exportar nuestros registros
JSON export includes the ledger, debts, preferences, extracted document text, drafts, and history. Original photos and PDFs can be downloaded from the document shelf.|La exportación JSON incluye movimientos, deudas, preferencias, texto extraído, borradores e historial. Puedes descargar las fotos y PDF originales desde los documentos.
Money spent|Dinero gastado
Money earned|Dinero ganado
Transfer / credit card payment|Transferencia / pago de tarjeta
Borrowed money / cash advance|Dinero prestado / adelanto de efectivo
Refund|Reembolso
Loan / cash advance repayment|Pago de préstamo / adelanto de efectivo
What do you call this account?|¿Cómo llamas a esta cuenta?
For example: Joint checking or Alan’s Visa|Por ejemplo: Cuenta compartida o Visa de Alan
Account type|Tipo de cuenta
Checking|Cuenta de cheques
Savings|Ahorros
Cash / wallet|Efectivo / cartera
Credit card|Tarjeta de crédito
Balance at the START of this date|Saldo al INICIO de esta fecha
Use the balance before that day’s transactions. For a credit card, enter what you owe as a negative number.|Usa el saldo anterior a los movimientos de ese día. Para una tarjeta de crédito, escribe lo que debes como número negativo.
Starting date|Fecha inicial
If importing statements, use the first statement’s opening date and balance.|Si importas estados de cuenta, usa la fecha y el saldo inicial del primero.
What was it for?|¿Para qué fue?
Amount|Monto
What happened?|¿Qué pasó?
Moved to (transfers only)|Se movió a (solo transferencias)
Date|Fecha
Category|Categoría
For example: Groceries, Fuel, Home, Eating out|Por ejemplo: Supermercado, Gasolina, Casa, Comidas fuera
Anything else?|¿Algo más?
Who do we owe?|¿A quién le debemos?
Type of debt|Tipo de deuda
Mortgage|Hipoteca
Personal / auto / student loan|Préstamo personal / auto / estudios
Consolidation|Consolidación
Cash advance app|App de adelantos de efectivo
Other|Otro
Total balance owed|Saldo total que debemos
Interest rate (APR %)|Tasa de interés anual (APR %)
Leave blank if unknown. Do not guess.|Déjalo en blanco si no lo sabes. No adivines.
Regular minimum payment|Pago mínimo habitual
Next due date|Próximo vencimiento
Past-due amount|Monto atrasado
Where things stand|Situación actual
Up to date|Al día
Behind on payments|Con pagos atrasados
In / leaving forbearance|En pausa de pagos / saliendo de ella
Repayment agreement|Acuerdo de pago
In collections|En cobranza
Automatic withdrawals are turned on|Los retiros automáticos están activados
Terms, fees, lender contact, or agreement details|Condiciones, cargos, contacto del prestamista o detalles del acuerdo
What is coming up?|¿Qué viene?
Type|Tipo
Bill / everyday essentials|Cuenta / gastos esenciales
Housing|Vivienda
Take-home pay|Ingreso neto
Debt minimum|Pago mínimo de deuda
Cash advance withdrawal|Retiro de adelanto de efectivo
First due date / payday|Primer vencimiento / día de cobro
How often?|¿Cada cuánto?
Just once|Una sola vez
Every week|Cada semana
Every two weeks|Cada dos semanas
Every month|Cada mes
Paying / receiving account|Cuenta de pago / recepción
Notes|Notas
What needs to happen?|¿Qué hay que hacer?
Deadline|Fecha límite
This needs urgent attention|Esto necesita atención urgente
This step is complete|Este paso está completo
Contact details, confirmation number, or next step|Contacto, número de confirmación o siguiente paso
What should the coach remember?|¿Qué debe recordar el asistente?
In your own words|Con tus propias palabras
Preferences, goals, category rules, or household context. You can change this later.|Preferencias, metas, reglas de categorías o información del hogar. Puedes cambiarlo después.
Spending category|Categoría de gasto
Use the same category name as your transactions, such as Groceries.|Usa el mismo nombre de categoría que en tus movimientos, como Supermercado.
Month (YYYY-MM)|Mes (AAAA-MM)
Our planned limit|Nuestro límite planeado
What are we saving for?|¿Para qué ahorramos?
Our goal|Nuestra meta
Already set aside|Ya apartado
Target date|Fecha objetivo
Where this money is kept|Dónde se guarda este dinero
The goal tracks progress. It does not move money or change account balances.|La meta mide tu avance. No mueve dinero ni cambia los saldos de tus cuentas.
Account to check|Cuenta a comprobar
Statement closing date|Fecha de cierre del estado de cuenta
Balance at the END of that date|Saldo al FINAL de esa fecha
Use a negative amount for money owed on a credit card. We compare this with the ledger; no money is added to force a match.|Usa un monto negativo para la deuda de una tarjeta. Lo comparamos con tus registros; no agregamos dinero para forzar que coincida.
Unsorted|Sin clasificar
Save|Guardar
Please check the entry.|Revisa el registro.
Optional|Opcional
Choose|Elegir
/ not sure yet|/ aún no lo sé
After saving, add its payment to the calendar so it appears in your cash-flow plan.|Después de guardar, agrega el pago al calendario para incluirlo en tu plan de dinero.
End of today|Al final de hoy
End of window|Al final del período
Our money.|Nuestro dinero.
A little clearer.|Un poco más claro.
A shared space to find your footing, make a plan, and build breathing room.|Un espacio compartido para saber dónde están, hacer un plan y crear un colchón.
Continue with Google|Continuar con Google
Only the two approved household accounts can sign in. If access was denied, choose the approved Gmail account and try again.|Solo pueden entrar las dos cuentas autorizadas del hogar. Si se rechazó el acceso, elige la cuenta de Gmail autorizada e inténtalo de nuevo.
Google sign-in is not connected yet. Finish the connection steps in the project’s setup guide before using this app from another device.|Aún falta conectar el inicio de sesión de Google. Completa los pasos de la guía de configuración antes de usar esta app desde otro dispositivo.
Language|Idioma
Language on this device|Idioma en este dispositivo
Each of you can choose a language. Your household records stay shared.|Cada quien puede elegir su idioma. Los registros del hogar siguen compartidos.
{amount} projected shortfall|Faltante estimado de {amount}
{amount} shortfall|Faltante de {amount}
{amount} difference to investigate|Diferencia de {amount} por investigar
Edit {name}|Editar {name}
Delete {name}|Eliminar {name}
{name} budget used|Presupuesto usado de {name}
{name} savings progress|Avance de ahorro de {name}
Projected end-of-day cash starts at {start} and ends at {end}. Lowest end-of-day balance {low}.|El efectivo estimado al cierre empieza en {start} y termina en {end}. El menor saldo al cierre es {low}.
Confirm all cash accounts and their opening balances.|Confirma todas las cuentas de efectivo y sus saldos iniciales.
Add all bills, debt minimums, advance withdrawals, and everyday essentials to the calendar.|Agrega al calendario las cuentas, pagos mínimos, retiros de adelantos y gastos esenciales.
Confirm take-home income and pay dates.|Confirma los ingresos netos y las fechas de cobro.
Finish processing uploaded documents.|Termina de procesar los documentos subidos.
An account has a future opening date.|Una cuenta tiene una fecha inicial futura.
Resolve the difference between a statement balance and the ledger.|Resuelve la diferencia entre el estado de cuenta y los registros.
Confirm the catch-up amounts and due dates on overdue or forbearance accounts before estimating extra spending.|Confirma los montos para ponerte al día y los vencimientos de las cuentas atrasadas o en pausa antes de estimar gastos extra.
Add interest rates and resolve overdue terms first. Cash advances need their actual fee and repayment schedule.|Primero agrega las tasas de interés y aclara los pagos atrasados. Los adelantos necesitan sus cargos reales y calendario de pago.
Add a debt to compare repayment plans.|Agrega una deuda para comparar planes de pago.
This payment does not clear the debts within 50 years. Review the payment amounts.|Este pago no liquida las deudas en 50 años. Revisa los montos de pago.
Enter a dollar amount with up to two decimal places.|Escribe un monto en dólares con hasta dos decimales. Usa punto decimal, por ejemplo 42.50.
Amount is too large.|El monto es demasiado grande.
Could not finish. Please try again.|No se pudo completar. Inténtalo de nuevo.
Use a decimal point, for example 42.50. Amounts are in US dollars.|Usa punto decimal, por ejemplo 42.50. Los montos son en dólares estadounidenses.
Checking cash flow|Revisando el flujo de dinero
Searching documents|Buscando documentos
Reviewing spending|Revisando gastos
Comparing debt plans|Comparando planes de deuda
Checking statement balances|Comprobando saldos
Preparing next steps|Preparando los próximos pasos
Checks completed|Revisiones realizadas
The assistant uses saved records, document search, and calculated tools. It can prepare entries for you to review.|El asistente usa los registros guardados, la búsqueda de documentos y herramientas de cálculo. Puede preparar registros para que los revises.
My conversation|Mi conversación
Your conversations are separate; confirmed household records and suggestions are shared.|Sus conversaciones son independientes; los registros confirmados y las sugerencias se comparten.
Connect an AI provider in setup to read images or use the coach. You can still enter records and import CSV files.|Conecta un proveedor de IA para leer imágenes o usar el asistente. Puedes seguir registrando datos e importando CSV.
Today’s AI call limit has been reached. Manual entry still works.|Alcanzaste el límite de consultas de IA de hoy. El registro manual sigue funcionando.
The AI response was incomplete. Try a shorter request or split the document into smaller files.|La respuesta de IA quedó incompleta. Prueba con una solicitud más corta o divide el documento.
The AI provider could not complete this request. Check its connection or balance and try again.|El proveedor de IA no pudo completar la solicitud. Revisa su conexión o saldo e inténtalo de nuevo.
The assistant reached its step limit. Please try a narrower question.|El asistente llegó al límite de pasos. Intenta una pregunta más específica.
Document summary. Review for accuracy before remembering.|Resumen del documento. Revisa que sea correcto antes de guardarlo como recuerdo.
AI is not connected yet. Add your first cash account and your next payday to get started.|La IA aún no está conectada. Para empezar, agrega tu primera cuenta de efectivo y tu próximo día de cobro.
account|cuenta
transaction|movimiento
debt|deuda
obligation|pago o ingreso
task|paso
memory|preferencia
budget|presupuesto
goal|meta
reconciliation|comparación de saldo
checking|cheques
savings|ahorros
cash|efectivo
credit|tarjeta de crédito
expense|gasto
income|ingreso
transfer|transferencia
borrowing|dinero prestado
refund|reembolso
debt_payment|pago de préstamo
mortgage|hipoteca
credit_card|tarjeta de crédito
loan|préstamo
consolidation|consolidación
cash_advance|adelanto de efectivo
other|otro
current|al día
late|atrasado
forbearance|pausa de pagos
agreement|acuerdo de pago
collections|cobranza
bill|cuenta por pagar
housing|vivienda
advance|adelanto
once|una sola vez
weekly|cada semana
biweekly|cada dos semanas
monthly|cada mes
local|local
cloud|en la nube
Money|Dinero
Plan|Plan
Main navigation|Navegación principal
MY MONEY, MADE CLEAR|MI DINERO, MÁS CLARO
Small steps. Real progress.|Pequeños pasos. Avances reales.
Set up shared access in Household|Configura el acceso compartido en Hogar
Household settings|Configuración del hogar
Suggestions to review|Sugerencias por revisar
Sign out|Cerrar sesión
Get a clear picture|Conoce tu situación
Start with one cash account. Add paydays, bills, debt payments, and everyday essentials. Confirm each list when it is complete.|Empieza con una cuenta de efectivo. Agrega días de pago, cuentas, pagos de deuda y gastos esenciales. Confirma cada lista cuando esté completa.
Continue setup|Continuar configuración
Protect the essentials|Protege lo esencial
Keep housing, food, utilities, and getting to work visible. If a payment is late, collect its deadline and ask the provider about options.|Ten presentes la vivienda, la comida, los servicios y el transporte al trabajo. Si un pago está atrasado, anota la fecha límite y pregunta al proveedor qué opciones hay.
See bills and next steps|Ver cuentas y siguientes pasos
Create breathing room|Crea un colchón
Choose a small cash buffer that fits your situation. A savings goal tracks your progress; it does not move money or reserve cash by itself.|Elige un pequeño colchón de efectivo según tu situación. Una meta de ahorro permite seguir tu avance; no mueve ni aparta dinero por sí sola.
Set a savings goal|Crear una meta de ahorro
Emergency cushion|Colchón para emergencias
Pay down debt with a plan|Reduce tus deudas con un plan
Once urgent terms are clear, compare interest-first and smallest-balance-first plans. An extra payment should still leave enough for essentials and your buffer.|Cuando conozcas las condiciones urgentes, compara pagar primero la deuda con más interés o la de menor saldo. Un pago extra debe dejar suficiente para lo esencial y tu colchón.
Compare debt plans|Comparar planes de deuda
Build your next chapter|Construye tu siguiente etapa
Keep your emergency plan current, then set longer-term goals. Ask the coach to help you understand retirement benefits and investment basics before choosing a product.|Mantén al día tu plan para emergencias y define metas a largo plazo. Pide ayuda al asistente para entender los beneficios de retiro y lo básico de las inversiones antes de elegir un producto.
Plan my next chapter|Planear mi siguiente etapa
Help me plan longer-term savings goals. First check what information you need about my situation.|Ayúdame a planear metas de ahorro a largo plazo. Primero revisa qué información necesitas sobre mi situación.
Give your housing deadline attention first.|Atiende primero el plazo de tu vivienda.
An overdue housing payment or mortgage needs a clear next step. Gather the notice, amount, and contact details.|Un pago de vivienda o hipoteca atrasado necesita un siguiente paso claro. Reúne el aviso, el monto y los datos de contacto.
Open housing steps|Ver pasos para la vivienda
A tight spot is coming. Let’s plan for it.|Se acerca un momento ajustado. Vamos a planearlo.
Listed bills and income show a possible cash shortfall. Review the dates and essentials before adding spending.|Las cuentas e ingresos registrados muestran una posible falta de efectivo. Revisa las fechas y los gastos esenciales antes de gastar más.
Review the cash forecast|Revisar el pronóstico de efectivo
Start with the account that pays your bills.|Empieza con la cuenta con la que pagas tus gastos.
One starting balance gives us a place to begin. You can bring in the rest a little at a time.|Un saldo inicial nos da por dónde empezar. Puedes agregar lo demás poco a poco.
Add my first account|Agregar mi primera cuenta
When does money come in next?|¿Cuándo vuelve a entrar dinero?
Add take-home pay and its date. If income changes, use your best current estimate and update it.|Agrega el sueldo que recibes después de descuentos y su fecha. Si cambia, usa tu mejor estimación actual y actualízala.
Add a payday|Agregar un día de pago
Let’s put the essentials on the calendar.|Anotemos lo esencial en el calendario.
Include housing, utilities, food, transport, debt minimums, and automatic withdrawals.|Incluye vivienda, servicios, comida, transporte, pagos mínimos y retiros automáticos.
Add a bill|Agregar una cuenta por pagar
Turn your documents into reliable records.|Convierte tus documentos en registros confiables.
Check suggested amounts and accounts before they become part of your ledger.|Revisa los montos y las cuentas sugeridas antes de agregarlos a tus registros.
Review documents|Revisar documentos
A balance needs a closer look.|Un saldo necesita revisión.
A statement and your ledger disagree. Review the difference before relying on the forecast.|Un estado de cuenta y tus registros no coinciden. Revisa la diferencia antes de confiar en el pronóstico.
Check balances|Comprobar saldos
Is your starting picture complete?|¿Ya está completa tu información inicial?
Confirm your account list after adding all the balances you want the plan to include.|Confirma tu lista de cuentas después de agregar todos los saldos que el plan debe incluir.
Confirm my setup|Confirmar mi información
Your next step: a quick money check-in.|Tu siguiente paso: una revisión rápida de tu dinero.
Review recent spending, upcoming bills, and anything waiting for your approval.|Revisa tus gastos recientes, los próximos pagos y lo que espera tu aprobación.
Review my ledger|Revisar mis movimientos
Review new documents|Revisar documentos nuevos
Imports and files waiting for attention.|Registros importados y archivos por revisar.
Give spending a category|Clasificar los gastos
Unsorted purchases and refunds.|Compras y reembolsos sin clasificar.
Check upcoming payments|Revisar próximos pagos
Listed outflows through the next payday, or seven days.|Salidas registradas hasta el próximo día de pago, o en siete días.
Compare balances|Comparar saldos
Differences found in saved statement checks.|Diferencias en las comprobaciones de estados de cuenta.
Your money. One step at a time.|Tu dinero. Un paso a la vez.
What matters today, and what to do next.|Lo que importa hoy y qué hacer después.
My roadmap|Mi camino
Quick actions|Acciones rápidas
I spent money|Gasté dinero
I got paid|Recibí dinero
Uploading…|Subiendo…
Scan or upload|Escanear o subir
Ask my coach|Pedir ayuda
YOUR NEXT MOVE|TU SIGUIENTE PASO
Starting picture|Información inicial
See what is missing|Ver qué falta
Money at a glance|Tu dinero de un vistazo
Cash recorded today|Efectivo registrado hoy
Checking, savings, and cash. Credit is separate.|Cheques, ahorros y efectivo. El crédito va por separado.
Add a cash account to begin.|Agrega una cuenta de efectivo para empezar.
Outflows through payday|Salidas hasta el día de pago
Outflows in the next 7 days|Salidas en los próximos 7 días
Next listed payday: {date}|Próximo día de pago registrado: {date}
No payday listed in the next 30 days.|No hay un día de pago registrado en los próximos 30 días.
Room after bills and buffer|Disponible después de pagos y colchón
Let’s finish the picture|Completemos la información
Missing facts stay unknown. No guessed spending limit.|Lo que falta sigue sin conocerse. Sin inventar límites de gasto.
Lowest estimated room over 30 days; not a guarantee.|El menor disponible estimado en 30 días; no es una garantía.
BEFORE YOU BUY|ANTES DE COMPRAR
Does this fit my plan?|¿Esta compra cabe en mi plan?
Try an extra purchase today that is not already in your ledger or calendar.|Prueba una compra extra de hoy que aún no esté en tus registros o calendario.
Purchase amount|Monto de la compra
Enter a positive dollar amount.|Escribe un monto mayor que cero.
A few facts are still missing.|Todavía faltan algunos datos.
It fits the current estimate.|Cabe en la estimación actual.
This would use money your plan needs.|Usaría dinero que tu plan necesita.
Complete the missing information before using a spending estimate.|Completa la información que falta antes de usar una estimación de gasto.
Room after this purchase and your buffer: {amount}|Disponible después de esta compra y tu colchón: {amount}
What to check|Qué revisar
One-time cash estimate for 30 days. Nothing is saved or spent.|Estimación de una compra en efectivo para 30 días. No se guarda ni se gasta nada.
Enter an amount to see how it affects your breathing room.|Escribe un monto para ver cómo afecta tu dinero disponible.
A SMALL WEEKLY HABIT|UN PEQUEÑO HÁBITO SEMANAL
Your money check-in|Tu revisión de dinero
A few minutes to catch missing entries and avoid surprises.|Unos minutos para detectar registros faltantes y evitar sorpresas.
Update older debt balances|Actualizar saldos de deuda antiguos
Coming up next|Lo que viene
Full plan|Ver plan
Add your next payday and the bills due before it.|Agrega tu próximo día de pago y las cuentas que vencen antes.
Add to calendar|Agregar al calendario
This month, so far|Lo que va del mes
Open ledger|Ver movimientos
Everyday spending, after refunds|Gastos diarios, menos reembolsos
Borrowed money|Dinero prestado
Loan repayments|Pagos de préstamos
Confirmed entries only. Transfers and card payments are separate, so purchases are counted once.|Solo registros confirmados. Las transferencias y los pagos de tarjeta van aparte; cada compra se cuenta una sola vez.
Set spending targets|Fijar límites de gasto
Worried about housing or an overdue bill?|¿Te preocupa la vivienda o un pago atrasado?
Keep the notice, deadline, and next call together. You can start before everything else is organized.|Guarda juntos el aviso, la fecha límite y la próxima llamada. Puedes empezar antes de organizar todo lo demás.
Get organized|Organizarme
Finish connecting your workspace|Termina de conectar tu espacio
AI chat|Chat de IA
Receipt reader|Lector de recibos
Google sign-in and shared hosting|Acceso con Google y alojamiento compartido
Set up|Configurar
Your roadmap, at your pace|Tu camino, a tu ritmo
These are tools to return to, not a score or a race. You can work on more than one at a time.|Son herramientas a las que puedes volver, no una calificación ni una carrera. Puedes trabajar en varias a la vez.
Learn more: CFPB money guides|Más información: guías de dinero del CFPB
Just the basics. You can add details later.|Solo lo básico. Puedes agregar detalles después.
Money you earned. For a loan or cash advance, use the detailed form.|Dinero que ganaste. Para un préstamo o adelanto, usa el formulario detallado.
For example: groceries at the supermarket|Por ejemplo: compra del supermercado
For example: my paycheck|Por ejemplo: mi sueldo
Not sure? Leave it Unsorted and decide during your check-in.|¿No estás seguro? Déjalo sin clasificar y decide durante tu revisión.
Save entry|Guardar registro
Transfer, borrowed money, or more details|Transferencia, dinero prestado o más detalles
Entry saved. Your balances are updated.|Registro guardado. Tus saldos están actualizados.
Income|Ingresos
Groceries|Supermercado
Transport|Transporte
Eating out|Comidas fuera
Home|Hogar
Health|Salud
Unsorted|Sin clasificar
Your ledger|Tus movimientos
Every confirmed entry, easy to find.|Cada registro confirmado, fácil de encontrar.
Quick entry|Registro rápido
Search a store, note, or category|Buscar tienda, nota o categoría
Activity type|Tipo de movimiento
All activity|Todos los movimientos
Transfers / card payments|Transferencias / pagos de tarjeta
Refunds|Reembolsos
Unsorted spending|Gastos sin clasificar
Accounts and dates|Cuentas y fechas
Account|Cuenta
All accounts|Todas las cuentas
From|Desde
Through|Hasta
Show all entries|Ver todos los registros
Earned|Ganado
Spent, after refunds|Gastado, menos reembolsos
Borrowed|Prestado
{count} matching entries|{count} registros encontrados
Totals follow your filters. Transfers are excluded from spending.|Los totales siguen tus filtros. Las transferencias no cuentan como gastos.
The start date must come before the end date.|La fecha inicial debe ser anterior a la final.
Future entry|Registro futuro
No entries match these filters.|Ningún registro coincide con estos filtros.
Your first entry starts the story.|Tu primer registro es el comienzo.
Try a different date, account, or search.|Prueba otra fecha, cuenta o búsqueda.
Add a purchase, record income, or review an uploaded statement.|Agrega una compra, registra un ingreso o revisa un estado de cuenta que hayas subido.
Add entry|Agregar registro
Show more entries|Ver más registros
Money sections|Secciones de dinero
Ledger|Movimientos
Accounts|Cuentas
Debts|Deudas
Budgets & goals|Límites y metas
Preparing a money check-in|Preparando tu revisión de dinero
Checking a purchase|Revisando una compra
Already on your calendar? Record it as paid or received there so it is not counted twice.|¿Ya está en tu calendario? Márcalo como pagado o recibido allí para no contarlo dos veces.
Open calendar|Abrir calendario
Is every payday on your list?|¿Incluiste todos los días de pago?
Review the income dates and amounts you have added. Confirm the list in Household only when it includes everything.|Revisa las fechas y los montos de ingreso que agregaste. Confirma la lista en Hogar solo cuando incluya todo.
Review and confirm|Revisar y confirmar
Any date|Cualquier fecha
Have you included every essential payment?|¿Incluiste todos los pagos esenciales?
Check bills, food, transport, debt minimums, and automatic withdrawals. Confirm the list in Household when it is complete.|Revisa cuentas, comida, transporte, pagos mínimos y retiros automáticos. Confirma la lista en Hogar cuando esté completa.
Chat|Chat
Open money chat|Abrir chat financiero
Minimize chat|Minimizar chat
Expand chat|Ampliar chat
Connect assistant|Conectar asistente
Connect an AI model to start chatting.|Conecta un modelo de IA para empezar a conversar.
`;
export const es: Record<string, string> = Object.fromEntries(
  pairs
    .trim()
    .split('\n')
    .map((line) => {
      const i = line.indexOf('|');
      return [line.slice(0, i), line.slice(i + 1)];
    }),
);
