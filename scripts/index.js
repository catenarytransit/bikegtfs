import chalk from 'chalk'
import fs from 'fs'

import pjson from '../package.json' assert { type: "json" }
import data from '../source/geo.json' assert { type: "json" }

console.log(chalk.bold.blue(`Catenary Bike Party GTFS utility v${pjson.version}`))

let finalstops = ['stop_id,stop_name,stop_lat,stop_lon']
let finalroutes = ['route_id,route_long_name,route_type,route_color,route_text_color']
let finaltrips = ['route_id,service_id,trip_id,trip_headsign,direction_id,shape_id,bikes_allowed']
let finalstoptimes = ['trip_id,arrival_time,departure_time,stop_id,stop_sequence']
let finalshapes = ['shape_id,shape_pt_lat,shape_pt_lon,shape_pt_sequence']

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

data.features.forEach((feature) => {
    if (feature.geometry.type == "MultiLineString") {
        let route = feature
        finalroutes.push(`bike-route-${routeidindex},${route.properties.name + ' Community Ride'},3,${route.properties['felt:color'].replace('#', '')},000000`)
        finaltrips.push(`bike-route-${routeidindex},bike-day-march-2024,bike-trip-${routeidindex},Community Ride to ${route.properties.description.split('\n').slice(-1).toString().split(',')[0]},0,bike-route-${routeidindex}-shape,1`)
        console.log(chalk.bold.green(`>> Added ${route.properties.name} Route:`))

        route.properties.description.split('\n').forEach(stop => {
            finalstoptimes.push(`bike-trip-${routeidindex},${stop.split(',')[1].trim()},${stop.split(',')[1].trim()},${makeid(stop.split(',')[0])},0`)
            console.log(chalk.green(`> ${stop.split(',')[1].trim()} timepoint at ${stop.split(',')[0]}`))
        })

        let shape_id = `bike-route-${routeidindex}-shape`
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

data.features.forEach((feature) => {
    if (feature.geometry.type == "Point") {
        let stop = feature
        finalstops.push(`${makeid(stop.properties.name)},${stop.properties.name} ${stop.properties["felt:symbol"] == "star" ? "Bike Stop" : "Bike Waypoint"},${stop.geometry.coordinates[1]},${stop.geometry.coordinates[0]}`)
        console.log(`+ indexed ${stop.properties["felt:symbol"] == "star" ? "stop" : "waypoint"} ${stop.properties.name} (${makeid(stop.properties.name)})`)
    }
})

fs.writeFileSync('sample/stops.txt', finalstops.join('\n'))
fs.writeFileSync('sample/routes.txt', finalroutes.join('\n'))
fs.writeFileSync('sample/trips.txt', finaltrips.join('\n'))
fs.writeFileSync('sample/stop_times.txt', finalstoptimes.join('\n'))
fs.writeFileSync('sample/shapes.txt', finalshapes.join('\n'))

fs.writeFileSync('sample/agency.txt', 'agency_name,agency_url,agency_id,agency_timezone\nCatenary Community Rides,https://catenarymaps.org/communityrides,bike-catenary,America/Los_Angeles')
fs.writeFileSync('sample/feed_info.txt', 'feed_publisher_name,feed_publisher_url,feed_lang\nCatenary,https://catenarymaps.org,en')
fs.writeFileSync('sample/calendar_dates.txt', 'service_id,date,exception_type\nbike-day-march-2024,20240331,1')

console.log(chalk.bold.blueBright('✔️ All done!'))