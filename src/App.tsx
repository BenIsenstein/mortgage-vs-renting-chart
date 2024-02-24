import { LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { MergeStateFunction, useMergeState } from 'useMergeState'
import { useScreenDimensions } from 'useScreenDimensions'

const MONTHLY_SNP_GROWTH = 1.006
const MONTHLY_REAL_ESTATE_GROWTH = 1.0015697
const ALBERTA_RESIDENTIAL_PROPERTY_TAX = 0.0065718

const Input = <T extends { [key: string]: unknown }>({ state, mergeState, prop }: { state: T, mergeState: MergeStateFunction<T>, prop: keyof T}) => {
  const isCheckbox = prop === 'HAS_MORTGAGE_INSURANCE'

  const props: React.InputHTMLAttributes<HTMLInputElement> = {
    type: isCheckbox ? 'checkbox' : undefined,
    [isCheckbox ? 'checked' : 'value']: state[prop]
  }

  return (
    <div>
      <label className="font-bold" htmlFor={prop as string}>{(prop as string).split('_').map(str => str[0] + str.toLowerCase().slice(1)).join(' ')}</label>
      <br />
      {/* @ts-expect-error no need to control mergeState types further */}
      <input id={prop as string} {...props} onChange={(e) => mergeState({ [prop]: isCheckbox ? !state[prop] : Number(e.target.value) })} />
    </div>
  )
}

export function App() {
  const [stagingState, mergeStagingState] = useMergeState({
    DOWN_PAYMENT: 120000,
    MONTHLY_BUDGET: 5000,
    
    HOME_PRICE: 600000,
    MORTGAGE_RATE_PERCENT: 6,
    MORTGAGE_YEARS: 25,
    TENANT_INCOME: 1500,
    HAS_MORTGAGE_INSURANCE: true,
    HOME_MAINTENANCE_BUDGET: 400,
    HOME_OWNERS_INSURANCE: 200,
    HOMEBUYER_LEGAL_FEES: 10000,
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
    MONTHLY_BUDGET,

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
  
  const MINIMUM_MONTHLY_BUDGET = Math.max(
    MONTHLY_RENT + RENTERS_INSURANCE + RENTER_UTILITIES + RENTER_OTHER_EXPENSES,
    MONTHLY_MORTGAGE_PAYMENT + HOME_OWNERS_INSURANCE + MONTHLY_PROPERTY_TAX + mortgageInsurancePremium + HOME_OWNER_UTILITIES + HOME_MAINTENANCE_BUDGET + HOME_OWNER_OTHER_EXPENSES
  )
  
  let year = new Date().getFullYear()
  let month = 0
  let quarter = 0

  for (let i = 0; i < MORTGAGE_MONTHS; i++) {
    const interestPaidThisMonth = homeOwner.mortgage * APR_RATE
    const equityBuiltThisMonth = MONTHLY_MORTGAGE_PAYMENT - interestPaidThisMonth

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
    <div className="box-border p-5 relative w-screen min-h-screen h-max bg-slate-200">
      <div className="mb-30 flex w-full justify-between">
        <div className="flex flex-col gap-4 w-1/3">
          <Input state={stagingState} mergeState={mergeStagingState} prop='DOWN_PAYMENT' />
          <Input state={stagingState} mergeState={mergeStagingState} prop='MONTHLY_BUDGET' />
        </div>
        <div className="flex flex-col gap-4 w-1/3">
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
        <div className="flex flex-col gap-4 w-1/3">
          <Input state={stagingState} mergeState={mergeStagingState} prop='MONTHLY_RENT' />
          <Input state={stagingState} mergeState={mergeStagingState} prop='RENTERS_INSURANCE' />
          <Input state={stagingState} mergeState={mergeStagingState} prop='RENTER_UTILITIES' />
          <Input state={stagingState} mergeState={mergeStagingState} prop='RENTER_OTHER_EXPENSES' />
        </div>
      </div>
      <LineChart 
        data={data}
        width={width * 0.75}
        height={height * 0.75}
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
      <div className="font-bold">Minimum monthly housing budget: ${MINIMUM_MONTHLY_BUDGET.toFixed(2)}</div>
      <div className="mt-8 flex w-full justify-between">
        <div className="mt-8 flex flex-col gap-4 w-1/2">
          <div>Mortgage rate of {MORTGAGE_RATE_PERCENT}%</div>
          <div>Home value of ${HOME_PRICE}</div>
          <div>Down payment of ${DOWN_PAYMENT}</div>
          <div>Original mortgage principal of ${ORIGINAL_PRINCIPAL}</div>
          <div>Mortgage period of {MORTGAGE_YEARS} years</div>
          <div>Monthly mortgage payment of ${MONTHLY_MORTGAGE_PAYMENT.toFixed(2)}</div>
          <div>Monthly property tax of ${MONTHLY_PROPERTY_TAX.toFixed(2)}</div>
          <div>Monthly homeowners insurance of ${HOME_OWNERS_INSURANCE.toFixed(2)}</div>
          <div>Monthly mortgage insurance premium of ${mortgageInsurancePremium.toFixed(2)}</div>
          <div>Total mortgage insurance premium of ${(mortgageInsurancePremium * MORTGAGE_MONTHS).toFixed(2)}</div>
        </div>
      </div>
    </div>
  )
}
