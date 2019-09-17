---
layout: HomeLayout
---

::: slot hero
<img src="../assets/logo.svg" style="margin-bottom: -40px; margin-left: -92px;" >

# CronosJS

<cron-demo />

:::

![license](https://img.shields.io/npm/l/cronosjs.svg)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/cronosjs.svg)
[![Build Status](https://travis-ci.com/jaclarke/cronosjs.svg?branch=master)](https://travis-ci.com/jaclarke/cronosjs)
[![Coverage Status](https://coveralls.io/repos/github/jaclarke/cronosjs/badge.svg?branch=master)](https://coveralls.io/github/jaclarke/cronosjs?branch=master)

Features:
 - Extended cron syntax support, including [last day](#last-day--l-) (`L`), [nearest weekday](#nearest-weekday--w-) (`W`), [nth of month](#nth-of-month---) (`#`), optional second and year fields, and [predefined expressions](#predefined-expressions)
 - Fixed offset and IANA [timezone support](#timezone-support), via `Intl` api
 - Configurable [daylight saving](#daylight-savings-behaviour) handling
 - Zero dependencies
