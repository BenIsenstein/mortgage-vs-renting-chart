import { Input } from 'Input'
import { UnstructuredTable } from 'UnstructuredTable'
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { useMergeState } from 'useMergeState'
import { useScreenDimensions } from 'useScreenDimensions'

const MONTHLY_SNP_GROWTH = 1.006
const MONTHLY_REAL_ESTATE_GROWTH = 1.0015697
const ALBERTA_RESIDENTIAL_PROPERTY_TAX = 0.0065718

const MONTH_TO_STRING = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

export function App() {
  const [stagingState, mergeStagingState] = useMergeState({
    DOWN_PAYMENT: 120000,
    
    HOME_PRICE: 600000,
    MORTGAGE_RATE_PERCENT: 6,
    MORTGAGE_YEARS: 25,
    TENANT_INCOME: 1500,
    HAS_MORTGAGE_INSURANCE: true,
    HOME_MAINTENANCE_BUDGET: 400,
    HOME_OWNERS_INSURANCE: 200,
    HOMEBUYER_LEGAL_FEES: 2000,
    HOME_OWNER_UTILITIES: 250,
    HOME_OWNER_OTHER_EXPENSES: 0,

    MONTHLY_RENT: 2500,
    RENTERS_INSURANCE: 20,
    RENTER_UTILITIES: 0,
    RENTER_OTHER_EXPENSES: 0
  })

  //const [state, setState] = useState(stagingState)

  const { width, height } = useScreenDimensions()

  const {
    DOWN_PAYMENT,

    HOME_PRICE,
    MORTGAGE_RATE_PERCENT,
    MORTGAGE_YEARS,
    TENANT_INCOME,
    HAS_MORTGAGE_INSURANCE,
    HOME_MAINTENANCE_BUDGET,
    HOME_OWNERS_INSURANCE,
    HOMEBUYER_LEGAL_FEES,
    HOME_OWNER_UTILITIES,
    HOME_OWNER_OTHER_EXPENSES,

    MONTHLY_RENT,
    RENTERS_INSURANCE,
    RENTER_UTILITIES,
    RENTER_OTHER_EXPENSES
  } = stagingState

  const renter = {
    budget: 0,
    stocks: DOWN_PAYMENT + HOMEBUYER_LEGAL_FEES,
    properties: 0,
    mortgage: 0,
    get netWorth() {
      return this.stocks + this.properties - this.mortgage 
    }
  }

  const homeOwner = {
    budget: 0,
    stocks: 0,
    properties: HOME_PRICE,
    mortgage: HOME_PRICE - DOWN_PAYMENT,
    get netWorth() {
      return this.stocks + this.properties - this.mortgage 
    }
  }
  
  const ORIGINAL_PRINCIPAL = HOME_PRICE - DOWN_PAYMENT
  const MORTGAGE_MONTHS = MORTGAGE_YEARS * 12
  const EAR_RATE = (1 + MORTGAGE_RATE_PERCENT * 0.005) ** 2
  const APR_RATE = (EAR_RATE ** (1 / 12)) - 1
  const MONTHLY_MORTGAGE_PAYMENT = ORIGINAL_PRINCIPAL * (APR_RATE * (1 + APR_RATE) ** MORTGAGE_MONTHS) / ((1 + APR_RATE) ** MORTGAGE_MONTHS - 1)
  const MONTHLY_PROPERTY_TAX = ALBERTA_RESIDENTIAL_PROPERTY_TAX * HOME_PRICE / 12

  const data = []
  const tableData = []

  let mortgageInsurancePremium = 0

  if (HAS_MORTGAGE_INSURANCE) {
    const loanToValueRatio = homeOwner.mortgage / HOME_PRICE

    if (loanToValueRatio <= 0.65) {
      mortgageInsurancePremium = homeOwner.mortgage * 0.006 / MORTGAGE_MONTHS
    } else if (loanToValueRatio <= 0.75) {
      mortgageInsurancePremium = homeOwner.mortgage * 0.017 / MORTGAGE_MONTHS
    } else if (loanToValueRatio <= 0.80) {
      mortgageInsurancePremium = homeOwner.mortgage * 0.024 / MORTGAGE_MONTHS
    } else if (loanToValueRatio <= 0.85) {
      mortgageInsurancePremium = homeOwner.mortgage * 0.028 / MORTGAGE_MONTHS
    } else if (loanToValueRatio <= 0.90) {
      mortgageInsurancePremium = homeOwner.mortgage * 0.031 / MORTGAGE_MONTHS
    } else if (loanToValueRatio <= 0.95) {
      mortgageInsurancePremium = homeOwner.mortgage * 0.04 / MORTGAGE_MONTHS
    }
  }
  
  const rentersBudget = MONTHLY_RENT + RENTERS_INSURANCE + RENTER_UTILITIES + RENTER_OTHER_EXPENSES
  const homeownersBudget = MONTHLY_MORTGAGE_PAYMENT + HOME_OWNERS_INSURANCE + MONTHLY_PROPERTY_TAX + mortgageInsurancePremium + HOME_OWNER_UTILITIES + HOME_MAINTENANCE_BUDGET + HOME_OWNER_OTHER_EXPENSES
  const MONTHLY_BUDGET = Math.max(rentersBudget, homeownersBudget)
  
  let year = new Date().getFullYear()
  let month = 0
  let quarter = 0

  for (let i = 0; i < MORTGAGE_MONTHS; i++) {
    const interestPaidThisMonth = homeOwner.mortgage * APR_RATE
    const equityBuiltThisMonth = MONTHLY_MORTGAGE_PAYMENT - interestPaidThisMonth

    const renterStocksGrowth = renter.stocks * (MONTHLY_SNP_GROWTH - 1)
    const renterPropertiesGrowth = renter.properties * (MONTHLY_REAL_ESTATE_GROWTH - 1)
    const homeownerStocksGrowth = homeOwner.stocks * (MONTHLY_SNP_GROWTH - 1)
    const homeownerPropertiesGrowth = homeOwner.properties * (MONTHLY_REAL_ESTATE_GROWTH - 1)

    renter.budget = MONTHLY_BUDGET
    homeOwner.budget = MONTHLY_BUDGET

    renter.stocks *= MONTHLY_SNP_GROWTH
    renter.properties *= MONTHLY_REAL_ESTATE_GROWTH

    homeOwner.stocks *= MONTHLY_SNP_GROWTH
    homeOwner.properties *= MONTHLY_REAL_ESTATE_GROWTH

    homeOwner.mortgage -= equityBuiltThisMonth

    renter.budget -= MONTHLY_RENT
    renter.budget -= RENTERS_INSURANCE
    renter.budget -= RENTER_UTILITIES
    renter.budget -= RENTER_OTHER_EXPENSES

    homeOwner.budget -= MONTHLY_MORTGAGE_PAYMENT
    homeOwner.budget -= HOME_OWNERS_INSURANCE
    homeOwner.budget -= MONTHLY_PROPERTY_TAX
    homeOwner.budget -= mortgageInsurancePremium
    homeOwner.budget -= HOME_MAINTENANCE_BUDGET
    homeOwner.budget -= HOME_OWNER_UTILITIES
    homeOwner.budget -= HOME_OWNER_OTHER_EXPENSES
    homeOwner.budget += TENANT_INCOME

    renter.stocks += renter.budget
    homeOwner.stocks += homeOwner.budget

    tableData.push({
      year,
      month: MONTH_TO_STRING[month],
      "Mortgage payment": MONTHLY_MORTGAGE_PAYMENT.toFixed(2),
      "Mortgage interest paid": interestPaidThisMonth.toFixed(2),
      "Mortage equity built": equityBuiltThisMonth.toFixed(2),
      "Homeowner's investments growth": homeownerStocksGrowth.toFixed(2),
      "Homeowner's home value growth": homeownerPropertiesGrowth.toFixed(2),
      "Renter's investments growth": renterStocksGrowth.toFixed(2),
      "Renter's home value growth": renterPropertiesGrowth.toFixed(2),
    })

    if (month < 11) {
      month++
    } else {
      month = 0
      year++
    }

    if (month % 3 === 0) {
      if (quarter < 3) {
        quarter++
      } else {
        quarter = 0
      }

      data.push({
        quarter: `${year} Q${quarter + 1}`,
        "Homeowner": homeOwner.netWorth.toFixed(2),
        "Renter": renter.netWorth.toFixed(2),
      })
    }
  }

  return (
    <div className="box-border p-5 relative w-screen min-h-screen h-max bg-yellow-50">
      <div className="mb-30 flex flex-col gap-16 w-full max-w-864px">
        <div>
          <h3 className="text-xl font-medium mb-4">Amounts in common</h3>
          <div className="flex flex-wrap gap-4">
            <Input state={stagingState} mergeState={mergeStagingState} prop='DOWN_PAYMENT' />
          </div>
        </div>
        <div>
          <h3 className="text-xl font-medium mb-4">Amounts for homeowner</h3>
          <div className="flex flex-wrap gap-4">
            <Input state={stagingState} mergeState={mergeStagingState} prop='HOME_PRICE' />
            <Input state={stagingState} mergeState={mergeStagingState} prop='MORTGAGE_RATE_PERCENT' />
            <Input state={stagingState} mergeState={mergeStagingState} prop='MORTGAGE_YEARS' />
            <Input state={stagingState} mergeState={mergeStagingState} prop='TENANT_INCOME' />
            <Input state={stagingState} mergeState={mergeStagingState} prop='HAS_MORTGAGE_INSURANCE' />
            <Input state={stagingState} mergeState={mergeStagingState} prop='HOME_MAINTENANCE_BUDGET' />
            <Input state={stagingState} mergeState={mergeStagingState} prop='HOME_OWNERS_INSURANCE' />
            <Input state={stagingState} mergeState={mergeStagingState} prop='HOMEBUYER_LEGAL_FEES' />
            <Input state={stagingState} mergeState={mergeStagingState} prop='HOME_OWNER_UTILITIES' />
            <Input state={stagingState} mergeState={mergeStagingState} prop='HOME_OWNER_OTHER_EXPENSES' />
          </div>
        </div>
        <div>
          <h3 className="text-xl font-medium mb-4">Amounts for renter</h3>
          <div className="flex flex-wrap gap-4">
            <Input state={stagingState} mergeState={mergeStagingState} prop='MONTHLY_RENT' />
            <Input state={stagingState} mergeState={mergeStagingState} prop='RENTERS_INSURANCE' />
            <Input state={stagingState} mergeState={mergeStagingState} prop='RENTER_UTILITIES' />
            <Input state={stagingState} mergeState={mergeStagingState} prop='RENTER_OTHER_EXPENSES' />
          </div>
        </div>
      </div>
      <h2 className="text-2xl font-medium mb-4">Net worth over time</h2>
      <LineChart 
        data={data}
        width={width * 0.75}
        height={height * 0.75}
        className='bg-white border-1 border-black mb-18'
        margin={{
          top: 15,
          right: 15,
          left: 15,
          bottom: 15,
        }}
      >
        <XAxis dataKey="quarter" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="Renter" stroke="#8884d8" />
        <Line type="monotone" dataKey="Homeowner" stroke="#82ca9d" />
      </LineChart>
      <h2 className="text-2xl font-medium mb-4">Breakdown</h2>
      <div className="flex flex-col gap-8 mb-18">
        <p>Based on the amount you expect to be spending in either scenario, <span className="italic">your monthly budget for housing is ${MONTHLY_BUDGET.toFixed(2)}</span></p>
        <p>We'll take this housing budget, and run a month-by-month simulation for the duration of your mortgage. The simulation is as follows:</p>
        <p>Each month, you start with an amount of funds equal to the budget above.</p>
        <p>You spend what is required to keep your current residence; paying rent and renter's insurance, or the various expenses of homeownership.</p>
        <p>In the case of paying a mortgage, the value of your mortgage will gradually go down, increasing the amount you stand to gain upon selling the property.</p>
        <p>You may also earn some income from owning the property, in which case, your budget for the month will be bolstered with that income.</p>
        <p>The value of your assets in both the real estate and stock markets appreciates at the average monthly rate.</p>
        <p>Finally, you take any unspent funds for the month and invest them in the stock market.</p>
      </div>
      <h2 className="text-2xl font-medium mb-4">Month-by-month data table</h2>
      <UnstructuredTable data={tableData} />
    </div>
  )
}
