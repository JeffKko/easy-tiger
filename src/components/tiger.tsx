import {useState, useCallback} from 'react'
import dayjs, {Dayjs} from 'dayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Unstable_Grid2';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

import axios from 'axios'

interface QueryProps {
  sinceDate: string
  untilDate: string
  code: string
  sessionID?: string
}

// "origin": "NGO",
// "destination": "XX3",
// "date": "2023-12-19",
// "currency": "TWD",
// "amount": 0,
// "fareLabels": []
interface FlightInfo {
  "origin": string,
  "destination": string,
  "date": string,
  "currency": string,
  "amount": number,
  "fareLabels": []
}

interface Result {
  data: {
    appLiveDailyPrices: FlightInfo[]
  }
}

const getResult = async (config: QueryProps) => {
  const payload = {
    "operationName": "appLiveDailyPrices",
    "variables": {
      "input": {
        "sessionId": config.sessionID ?? "651311dca8e7cf9ac60c16ee",
        "origin": config.code ?? "NGO",
        "destination": "XX3",
        "userCurrency": "TWD",
        "pricingCurrency": "TWD",
        "since": config.sinceDate,
        "until": config.untilDate,
        "source": "resultPagePriceBrick"
      }
    },
    "query": "query appLiveDailyPrices($input: QueryLiveDailyPricesInput!) {\n  appLiveDailyPrices(input: $input) {\n    origin\n    destination\n    date\n    currency\n    amount\n    fareLabels {\n      id\n    }\n  }\n}\n"
  }

  try {
    // const endpoint = 'http://localhost:8082'
    const hostname = 'https://rich-kko.de.r.appspot.com'
    const { data } = await axios.post<Result>(`${hostname}/api/v1/momoMock/redirect`, payload)

    return data?.data?.appLiveDailyPrices
  } catch (error) {
    console.log('error', error)
  }
  return null
}

export const  Tiger = () => {
  const [sessionID, setSessionID] = useState('651311dca8e7cf9ac60c16ee')
  const [code, setCode] = useState('NGO')
  const [startDate, setStartDate] = useState<Dayjs>(dayjs());
  const [endDate, setEndDate] = useState<Dayjs>(dayjs().add(7, 'day'));
  const [flightList, setFlightList] = useState<FlightInfo[]>([])

  const handleSelectSinceDate = useCallback((newValue: Dayjs | null) => {
    if (!newValue) return

    setStartDate(newValue)
    if (newValue.isAfter(endDate)) {
      setEndDate(newValue.add(7, 'day'))
    }
  }, [endDate])

  const handleSearch = useCallback(() => {
    (async() => {
      const config = {
        sinceDate: startDate.format('YYYY-MM-DD'),
        untilDate: endDate.format('YYYY-MM-DD'),
        sessionID,
        code,
      }
      const result = await getResult(config)

      if (!result) {
        console.log('no result')
        return
      }

      setFlightList(result)
    })()
  }, [startDate, endDate, code, sessionID])

  return (
    <div>
      <TextField
        label="sessionID"
        // sx={{ width: '100%' }}
        variant="outlined"
        value={sessionID}
        onChange={e => setSessionID(e.target.value.trim())}
      />
      <TextField
        label="機場代碼"
        // sx={{ width: '100%' }}
        variant="outlined"
        value={code}
        onChange={e => setCode(e.target.value.trim())}
      />
      <div>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          {/* <DatePicker label="Uncontrolled picker" defaultValue={dayjs('2022-04-17')} /> */}
          <DatePicker
            label="Since Date"
            value={startDate}
            onChange={handleSelectSinceDate}
          />
          <DatePicker
            label="Until Date"
            value={endDate}
            onChange={(newValue) => setEndDate(newValue ?? dayjs())}
          />
        </LocalizationProvider>
        <Button
          variant="outlined"
          onClick={handleSearch}
          size="small"
          // startIcon={<AddIcon />}
        >
          搜尋
        </Button>
      </div>
      <Grid container spacing={2} rowSpacing={2} my={8}>
        {
          flightList.map(flightInfo => {
            return (
              <Grid
                sm={2}
                md={2}
                container
                alignItems="center"
                justifyContent="right"
              >
                <Card>
                  <CardContent>
                    <div>{flightInfo.date}</div>
                    {
                      flightInfo.amount > 0
                        ? <div>$ {flightInfo.amount.toLocaleString('en-us')}</div>
                        : <div>-</div>
                    }
                  </CardContent>
                </Card>
              </Grid>
            )
          })
        }
      </Grid>
    </div>
  )
}