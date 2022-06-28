import AddressFormatter from './AddressFormatter'

class Maps {
    constructor(settings) {
        this.settings = {...settings}

        this.events = {}
        this.map = null
        this.autocomplete = null
        this.geocoder = null
        this.formatter = new AddressFormatter()

        this.onClick = this.onClick.bind(this)
        this.onChange = this.onChange.bind(this)
        this.onInput = this.onInput.bind(this)

        this.settings.input.addEventListener('input', this.onInput)

        if(this.settings.resourceName == 'properties') {
            if(this.settings.fieldName == 'google_map_internal') {
                window.initMap = () => {
    
                    this.initializeServices()
                    this.initializeAddress(this.settings.value)
                    
                    window.initPublicMap()
                }
            }
            else {
                window.initPublicMap = () => {
    
                    this.initializeServices()
                    this.initializeAddress(this.settings.value)
                }
            }
        }
        else {
            window.initMap = () => {
    
                this.initializeServices()
                this.initializeAddress(this.settings.value)
            }
        }

        this.appendScript()
    }

    initializeAddress(address) {
        if (address && address.latitude && address.longitude) {
            const location = {lat: address.latitude, lng: address.longitude}
            this.setMarker(location)

            this.map.panTo(location)
            this.map.setZoom(12)
        }
    }

    initializeServices() {

        this.map = new google.maps.Map(
            document.getElementById(this.settings.fieldName),
            {
                zoom: this.settings.zoom,
                center: this.settings.center,
                mapTypeControl: true,
                streetViewControl: false,
                fullscreenControl: true,
                ...this.settings.mapOptions,
            }
        )

        this.geocoder = new google.maps.Geocoder
        this.autocomplete = new google.maps.places.Autocomplete(this.settings.input, {
            types: this.settings.types,
            ...this.settings.autoCompleteOptions,
        })

        if(this.settings.allowMapClick) {
            this.map.addListener('click', this.onClick)
        }
        this.autocomplete.addListener('place_changed', this.onChange)
    }

    appendScript() {
        this.script = document.createElement('script')
        const extraParams = this.settings.scriptUrlParams ? `&${this.getUrlParamsFromObj(this.settings.scriptUrlParams)}` : '';
        this.script.src = `https://maps.googleapis.com/maps/api/js?key=${this.settings.key}&libraries=places&callback=initMap${extraParams}`
        this.script.id = 'nova-maps-address-script'
        this.script.defer = true

        if( !document.getElementById("nova-maps-address-script")) {
            document.head.appendChild(this.script);
        }
           
    }

    getUrlParamsFromObj(params) {
        return Object.keys(params)
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
            .join('&');
    }

    onChange() {
        const place = this.autocomplete.getPlace()

        this.setMarker(place.geometry.location)

        this.map.panTo(place.geometry.location)
        this.map.setZoom(12)

        this.emit('change', {
            value: JSON.stringify(this.formatter.format(place)),
            formatted: place.formatted_address,
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng(),
        })
    }

    onInput(e) {
        // this.reset()
        // this.emit('change', { formatted: e.target.value })
        
        this.settings.value.formatted_address = e.target.value;
        
        this.emit('change', {
            formatted: e.target.value,
            value: JSON.stringify(this.settings.value),
            latitude: this.settings.value.latitude,
            longitude: this.settings.value.longitude,
        })
    }

    onClick(data) {
        this.setMarker(data.latLng)
        
        this.settings.value = {
            latitude : data.latLng.lat(),
            longitude : data.latLng.lng(),
        }

        this.emit('change', {
            value: JSON.stringify(this.settings.value),
            latitude: data.latLng.lat(),
            longitude: data.latLng.lng(),
        })
        
    }

    reset() {
        this.emit('change', { value: null })

        if (this.marker) {
            this.marker.setMap(null)
        }
    }

    setMarker(position) {
        if (this.marker) {
            this.marker.setMap(null)
        }

        this.marker = new google.maps.Marker({
            position: position,
            animation: google.maps.Animation.DROP,
            map: this.map,
        })
    }

    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = []
        }

        this.events[event].push(callback)
    }

    emit(event, data) {
        if (!this.events[event]) {
            return
        }

        this.events[event].forEach((callback) => callback(data))
    }

    updateMapGeocode(latitude, longitude) {
        const location = {lat: parseFloat(latitude), lng: parseFloat(longitude)}
        this.setMarker(location)
        this.map.panTo(location)
    }

    destroy() {
        window.google = undefined
       this.script.remove()
    }
}

export default Maps
