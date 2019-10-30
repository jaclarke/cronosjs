<template>
<div class="clock-container">
  <svg class="clock" viewBox="-100 -100 200 200">
    
    <circle class="face" r="100" />

    <text class="number"  v-for="angle, i in minSecArray"
      v-bind="toXY(angle, 90)">{{ i*5 }}</text>

    <line class="marker" v-for="sec in $store.getters.secondsValues" :y1="-80" :y2="-75"
      :transform="`rotate(${sec*6})`" />

    <line class="marker" v-for="min in $store.getters.minutesValues" :y1="-66" :y2="-61"
      :transform="`rotate(${min*6})`" />

    <g class="second-hand" :transform="`rotate(${cronosDate.second*6})`">
      <rect x="-1.5" y="-81.5" width="3" height="8" rx="1.5" />
      <line y1="-73" />
    </g>

    <path class="hand" :transform="`rotate(${cronosDate.minute*6})`"
      d="M -2 -68 a 2 2 0 0 1 4 0 L 2 0 a 2 2 0 0 1 -4 0 z
         M 1 -66 a 1 1 0 0 0 -2 0 l 0 5 a 1 1 0 0 0 2 0 z" />

    <path class="hour-face-day"   :d="`M 0 0 L ${hourFace.p18} A 53 53 0 ${hourFace.large?1:0} 0 ${hourFace.p6} z`" />
    <path class="hour-face-night" :d="`M 0 0 L ${hourFace.p18} A 53 53 0 ${hourFace.large?0:1} 1 ${hourFace.p6} z`" />
    <path class="repeated-hour-highlight" v-if="repeatedHourHighlightPath" :d="repeatedHourHighlightPath" />
    <line class="missing-hour-highlight" v-if="hourData.missingIndex !== -1"
      v-bind="toXY(hourData.missingIndex*hourAngle, 53, '2')" />

    <g v-for="h, i in hourData.hours" v-if="h.show" class="number"
      :transform="`translate(${toXYString(hourAngle*i, 44)})`">  
      <template v-if="showUTC">
        <text y="-2">{{ h.utcFormatted.hour }}</text>
        <text class="number-utcminute" y="4">{{ h.utcFormatted.minutes }}</text>
      </template>
      <text v-else>{{ h.formatted }}</text>
    </g>

    <line class="marker" v-for="hourIndex in markedHours" :y1="-33" :y2="-28"
      :transform="`rotate(${hourIndex*hourAngle})`" />

    <path class="hand" :transform="`rotate(${hourRotation})`"
      d="M -2 -35 a 2 2 0 0 1 4 0 L 2 0 a 2 2 0 0 1 -4 0 z
         M 1 -33 a 1 1 0 0 0 -2 0 l 0 5 a 1 1 0 0 0 2 0 z" />

    <g class="type" :transform="`translate(0 ${hourRotation >= 90 && hourRotation <= 270 ? -10 : 10})`"
      @click="showUTC = !showUTC">
      <rect x="-13" y="-5" width="26" height="9" rx="4.5" />
      <text>{{showUTC ? 'UTC' : 'local'}}</text>
    </g>

  </svg>
</div>
</template>

<script>
import { mapGetters } from 'vuex'
import { CronosDate, CronosTimezone } from '../../pkg/dist-src/date'
let timer;

function getUTCFormat(timestamp) {
  const date = new Date(timestamp)
  return {
    hour: String(date.getUTCHours()).padStart(2, '0'),
    minutes: String(date.getUTCMinutes()).padStart(2, '0')
  }
}

export default {
  data() {
    return {
      showUTC: false,
      currentDate: new Date(),
      minSecArray: Array(12).fill(0).map((_,i) => i*30)
    }
  },
  computed: {
    date() {
      return this.selectedDate || this.currentDate
    },
    startMidnight() {
      return this.cronosDate.copyWith({hour: 0, minute: 0, second: 0})
        .toDate(this.tz).getTime()
    },
    endMidnight() {
      return this.cronosDate.copyWith({day: this.cronosDate.day+1, hour: 0, minute: 0, second: 0})
        .toDate(this.tz).getTime()
    },
    hourData() {
      const hours = []
      let timestamp = this.startMidnight,
          missingIndex = -1,
          repeatedIndex = -1,
          i = 0

      while (timestamp < this.endMidnight) {
        const hour = CronosDate.fromDate(new Date(timestamp), this.tz).hour,
              thisHour = {
                hour,
                show: hour % 3 === 0,
                formatted: String(hour).padStart(2, '0'),
                utcFormatted: getUTCFormat(timestamp)
              },
              prevHour = hours[i-1] || {hour: -1, show: false}

        if (prevHour.hour === hour || hour !== prevHour.hour + 1) {
          prevHour.show = thisHour.show = true
          if (prevHour.hour === hour) repeatedIndex = i
          else missingIndex = i
        }

        hours.push(thisHour)
        timestamp += 3600000
        i++
      }

      return { hours, missingIndex, repeatedIndex }
    },
    hourAngle() {
      return 360/this.hourData.hours.length
    },
    markedHours() {
      const { hourData } = this,
            marks = new Set()
      
      if (!this.hoursValues) return;

      this.hoursValues.forEach(hour => {
        marks.add(hourData.hours.findIndex(h => h.hour === hour))
      })
      if (this.missingHour !== 'skip' && hourData.missingIndex !== -1) {
        marks.add(hourData.missingIndex)
      }
      if (!this.skipRepeatedHour && hourData.repeatedIndex !== -1) {
        marks.add(hourData.repeatedIndex)
      }
      marks.delete(-1)
      return [...marks]
    },
    hourFace() {
      const index6  = this.hourData.hours.findIndex(h => h.hour === 6),
            index18 = this.hourData.hours.findIndex(h => h.hour === 18)
      return {
        p6: this.toXYString(index6*this.hourAngle, 53),
        p18: this.toXYString(index18*this.hourAngle, 53),
        large: (index18 - index6)*this.hourAngle > 180
      }
    },
    hourRotation() {
      return Math.floor((this.date.getTime() - this.startMidnight) / 3600000) * this.hourAngle
    },
    repeatedHourHighlightPath() {
      const {hourData, hourAngle, toXYString} = this
      if (hourData.repeatedIndex === -1) return ''

      const hour = hourData.repeatedIndex
      return `M ${toXYString(hour*hourAngle, 53)} A 53 53 0 0 1 ${toXYString((hour+1)*hourAngle, 53)} L 0 0 z`
    },
    cronosDate() {
      return CronosDate.fromDate(this.date, this.tz)
    },
    ...mapGetters(['tz', 'missingHour', 'skipRepeatedHour', 'hoursValues', 'selectedDate'])
  },
  methods: {
    toXY(angle, radius, suffix = '') {
      const rad = angle * (Math.PI / 180)
      return {
        ['x'+suffix]: radius * Math.sin(rad),
        ['y'+suffix]: radius * -Math.cos(rad)
      }
    },
    toXYString(angle, radius) {
      const p = this.toXY(angle, radius)
      return p.x + ' ' + p.y
    },
  },
  created() {
    // timer = setInterval(() => this.currentDate = new Date(), 1000)
  },
  destroyed() {
    clearInterval(timer)
  }
}
</script>

<style lang="stylus">
$size = 400px

.clock-container
  position: relative
  width: $size
  height: $size
  box-shadow: 0px 4px 15px rgba(0, 0, 0, 0.2)
  border-radius: 50%

  &:after
    position: absolute
    content: ''
    top: 23.5%
    bottom: 23.5%
    left: 23.5%
    right: 23.5%
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.14)
    border-radius: 50%
    pointer-events: none

.clock
  width: $size
  text-anchor: middle
  dominant-baseline: middle
  font-family: 'Montserrat', sans-serif
  font-size: 7px

.face
  fill: rgba(255, 255, 255, 0.95)

.number
  fill: #777
  font-weight: 500

  &-utcminute
    font-size: 5px

.tick
  stroke: #aaa
  stroke-width: 0.5px
  stroke: none

.hour-face
  &-day
    fill: rgba(245, 245, 245, 0.9)

  &-night
    fill: rgba(230, 230, 230, 0.9)

.hand
  fill: #555

.second-hand
  fill: none
  stroke: #555
  stroke-width: 1px
  stroke-linecap: round

.marker
  stroke: #2e62aa
  stroke-width: 1.5px
  stroke-linecap: round

.type
  cursor: pointer

  text
    text-transform: uppercase
    font-size: 5px
    fill: rgba(#888)
    font-weight: 500

  rect
    fill: rgba(255,255,255,0.7)

.repeated-hour-highlight
  fill: rgba(255, 84, 0, 0.4)

.missing-hour-highlight
  stroke: rgba(255, 84, 0, 0.4)
</style>
