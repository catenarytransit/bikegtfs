import chalk from 'chalk'
import fs from 'fs'

import pjson from '../package.json' assert { type: "json" }
import data from '../source/geo.json' assert { type: "json" }
import config from '../source/config.json' assert { type: "json" }

console.log(chalk.bold.blue(`Catenary Bike Party GTFS utility v${pjson.version}`))
console.log(chalk.yellow(`(i) ${data.features.length} features found in GeoJSON\n(i) generating GTFS for ${config.name}\n`))

let finalstops = ['stop_id,stop_name,stop_lat,stop_lon']
let finalroutes = ['route_id,route_long_name,route_type,route_color,route_text_color']
let finaltrips = ['route_id,service_id,trip_id,trip_headsign,direction_id,shape_id,bikes_allowed']
let finalstoptimes = ['trip_id,arrival_time,departure_time,stop_id,stop_sequence']
let finalshapes = ['shape_id,shape_pt_lat,shape_pt_lon,shape_pt_sequence']
let finaldates = ['service_id,date,exception_type']

let routeidindex = 1

function makeid(name) {
    let stop_id = ''
    name.split(' ').forEach(word => {
        let first_letter = word.charAt(0).toLowerCase()
        stop_id += first_letter
        let rest_of_word = word.slice(1).toLowerCase()
        stop_id += rest_of_word.replace(/a/g, '').replace(/e/g, '').replace(/i/g, '').replace(/o/g, '').replace(/u/g, '').replace('\'', '').replace('/', '')
    })
    return stop_id
}

console.log(chalk.bold.yellow(`(1/3) indexing stops`))

let stopcount = 0

data.features.forEach((feature) => {
    if (feature.geometry.type == "Point") {
        let stop = feature
        finalstops.push(`${makeid(stop.properties.name)},${stop.properties.name} ${config.stop},${stop.geometry.coordinates[1]},${stop.geometry.coordinates[0]}`)
        console.log(`+ ${stop.properties.name} (${makeid(stop.properties.name)})`)
        stopcount++
    }
})

console.log(chalk.yellow(`(i) ${stopcount} stops indexed\n`))
console.log(chalk.bold.yellow(`(2/3) indexing routes`))

let routecount = 0
let timepointcount = 0

data.features.forEach((feature) => {
    if (feature.geometry.type == "MultiLineString") {
        let route = feature
        routecount++
        finalroutes.push(`${config.prefix}-route-${routeidindex},${route.properties.name + ' ' + config.service},3,${route.properties['felt:color'].replace('#', '')},000000`)
        finaltrips.push(`${config.prefix}-route-${routeidindex},${config.prefix}-service-route-${routeidindex},${config.prefix}-trip-${routeidindex},${route.properties.description.split('\n').slice(-1).toString().split(',')[0]},0,bike-route-${routeidindex}-shape,1`)
        console.log(chalk.blueBright(`+ ${route.properties.name} route`))

        config.runs.forEach(run => {
            if (run.route == route.properties.name) {
                finaldates.push(`${config.prefix}-service-route-${routeidindex},${run.date},1`)
                console.log(chalk.magentaBright(`> this route will run on ${run.date}`))
            }
        })

        route.properties.description.split('\n').forEach(stop => {
            finalstoptimes.push(`${config.prefix}-trip-${routeidindex},${stop.split(',')[1].trim()},${stop.split(',')[1].trim()},${makeid(stop.split(',')[0])},0`)
            console.log(`+ ${stop.split(',')[1].trim()} timepoint at ${stop.split(',')[0]}`)
            timepointcount++
        })

        let shape_id = `${config.prefix}-route-${routeidindex}-shape`
        let all_shapes_for_route = []
        route.geometry.coordinates.forEach((set, index) => {
            set.forEach((coord, index) => {
                all_shapes_for_route.push(`${shape_id},${coord[1]},${coord[0]},${index}`)
            })
        })
        finalshapes.push(...all_shapes_for_route)
        routeidindex++
    }
})

console.log(chalk.yellow(`(i) ${routecount} routes indexed (${timepointcount} timepoints)\n`))

console.log(chalk.bold.yellow(`(3/3) writing GTFS files`))

fs.writeFileSync('sample/stops.txt', finalstops.join('\n'))
fs.writeFileSync('sample/routes.txt', finalroutes.join('\n'))
fs.writeFileSync('sample/trips.txt', finaltrips.join('\n'))
fs.writeFileSync('sample/stop_times.txt', finalstoptimes.join('\n'))
fs.writeFileSync('sample/shapes.txt', finalshapes.join('\n'))

fs.writeFileSync('sample/agency.txt', `agency_name,agency_url,agency_id,agency_timezone\n${config.name},${config.url},${config.agency},${config.tz}`)
fs.writeFileSync('sample/feed_info.txt', `feed_publisher_name,feed_publisher_url,feed_lang\n${config.name},${config.url},${config.lang}`)
fs.writeFileSync('sample/calendar_dates.txt', finaldates.join('\n'))

console.log(chalk.yellow(`(i) GTFS files written to /sample\n`))
console.log(chalk.bold.greenBright('✔️ All done!'))