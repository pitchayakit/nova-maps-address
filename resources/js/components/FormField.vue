<template>
    <default-field :field="field" :errors="errors" :full-width-content="true" :show-help-text="showHelpText">
        <template slot="field">
            <input type="hidden" name="" :value="this.value">
            <input
                :id="field.name"
                type="text"
                class="w-full form-control form-input form-input-bordered nova-maps-address-input"
                :class="errorClasses"
                :placeholder="field.name"
                :value="this.formatted"
                ref="input"
            />
            <div :id="fieldName"  class="nova-maps-address-container" ref="container"></div>

            <div class="flex flex-wrap w-full">
                <div class="flex w-1/2">
                    <div class="w-1/5 py-3 pl-2">
                        <label class="inline-block pt-2 leading-tight text-80">Lat</label>
                    </div>
                    <div class="w-4/5 py-3">
                    <input type="number" step=any v-model="latitude" @change="latLongChange" class="w-full form-control form-input form-input-bordered nova-maps-address-input">
                    </div>
                </div>

                <div class="flex w-1/2">
                    <div class="w-1/5 py-3 pl-2">
                        <label class="inline-block pt-2 leading-tight text-80">Long</label>
                    </div>
                    <div class="w-4/5 py-3">
                    <input  type="number" step=any v-model="longitude"  @change="latLongChange" class="w-full form-control form-input form-input-bordered nova-maps-address-input">
                    </div>
                </div>
            </div>
           
        </template>
    </default-field>
</template>

<script>
import {FormField, HandlesValidationErrors} from 'laravel-nova'
import Maps from '../Maps'

let timeout;

export default {
    mixins: [FormField, HandlesValidationErrors],

    props: ['resourceName', 'resourceId', 'field'],

    data() {
        return {
            maps: null,
            value: null,
            formatted: null,
            fieldName: _.snakeCase(this.field.name),
            latitude: null,
            longitude: null,
            developmentMapValue: null,
        }
    },

    created () {
        if(this.resourceName === 'properties' && this.field.value == null) 
            this.registerDependencyWatchers(this.$root);
    },

    methods: {
        /*
         * Set the initial, internal value for the field.
         */
        setInitialValue() {
            const address = this.field.value
            this.formatted = address ? address.formatted_address : ''
            this.latitude = address ? address.latitude : ''
            this.longitude = address ? address.longitude : ''
            this.value = JSON.stringify(this.field.value) || ''
        },

        /**
         * Fill the given FormData object with the field's internal value.
         */
        fill(formData) {
            formData.append(this.field.attribute, this.value || '')
        },

        latLongChange() {

            if(this.latitude && this.longitude) {
                let obj = {
                    latitude : parseFloat(this.latitude),
                    longitude : parseFloat(this.longitude),
                }

                 this.value = JSON.stringify(obj) || ''

                this.refreshMap();
            }
               
        },

        refreshMap() {
            this.maps.updateMapGeocode(this.latitude, this.longitude)
        },

        registerDependencyWatchers(root) {
            root.$children.forEach(component => {
                if (this.componentIsDependency(component)) {
                    if (component.selectedResourceId !== undefined) {
                        // BelongsTo field
                         component.$watch('selectedResourceId', this.dependencyWatcher);
                    } 
                }
                this.registerDependencyWatchers(component);
            })
        },

        componentIsDependency(component) {
            if (component.field === undefined) {
                return false;
            }

            return component.field.attribute === 'development';
        },

        dependencyWatcher(value) {
            clearTimeout(this.watcherDebounce);
            
            this.watcherDebounce = setTimeout(() => {
                if (value === this.dependsOnValue) {
                    return;
                }

                this.dependsOnValue = value;
                this.getDevelopmentValue(value)

                this.watcherDebounce = null;
            }, this.watcherDebounceTimeout);
        },

        getDevelopmentValue(developmentId) {
            Nova.request(`/api/developments/${developmentId}/google-map`).then((data) => {
                
                const address = data.data

                //Update map value
                if(address) {
                    this.formatted = address ? address.formatted_address : ''
                    this.latitude = address ? address.latitude : ''
                    this.longitude = address ? address.longitude : ''
                    this.value = JSON.stringify(address) || ''

                    this.refreshMap()
                }
                else {
                    this.maps.reset()
                }
          });
        },
    },
    mounted() {
        this.setInitialValue()
        this.maps = new Maps({
            input: this.$refs.input,
            container: this.$refs.container,
            value: this.field.value,
            key: this.field.googleKey,
            zoom: this.field.zoom,
            center: this.field.center,
            types: this.field.types,
            autoCompleteOptions: this.field.autoCompleteOptions,
            scriptUrlParams: this.field.scriptUrlParams,
            mapOptions: this.field.mapOptions,
            allowMapClick: this.field.allowMapClick,
            fieldName: this.fieldName,
            resourceName: this.resourceName,
        });

        this.maps.on('change', (data) => {
            this.value = data.value
            this.formatted = data.formatted
            this.latitude = data.latitude
            this.longitude = data.longitude
        })
    },
    destroyed() {
        this.maps.destroy()
    }
}



        
</script>
<style>
.nova-maps-address-container {
    height: 400px;
    margin-top: 1rem;
    border-width: 1px;
    border-color: var(--60);
    border-radius: .5rem;
}
</style>
