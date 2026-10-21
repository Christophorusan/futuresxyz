import { describe, expect, it } from 'vitest'
import { appendSnapshot, parseHistory } from './walletHistory'
describe('wallet history', () => {
  it('rejects corrupt values, sorts and deduplicates timestamps', () => {
    expect(parseHistory('[{"time":20,"value":2},{"time":10,"value":1},{"time":20,"value":3},{"time":30,"value":-1}]')).toEqual([{time:10,value:1},{time:20,value:3}])
    expect(parseHistory('broken')).toEqual([])
  })
  it('records actual values at least one minute apart', () => {
    const points=[{time:100000,value:12}]
    expect(appendSnapshot(points,{time:110000,value:15})).toEqual(points)
    expect(appendSnapshot(points,{time:160000,value:15})).toEqual([...points,{time:160000,value:15}])
  })
  it('keeps older history at hourly resolution without fabricating samples', () => {
    const now=100*86400000
    const points=[{time:1,value:7},{time:now-2*86400000,value:8},{time:now-2*86400000+60000,value:9}]
    expect(appendSnapshot(points,{time:now,value:10})).toEqual([points[2],{time:now,value:10}])
  })
})
