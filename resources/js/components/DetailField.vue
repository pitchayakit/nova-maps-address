<template>
    <panel-item :field="field">
        <template slot="value">
            {{ getValue() }}

                <input
                    :id="field.name"
                    type="text"
                    class="hidden w-full form-control form-input form-input-bordered nova-maps-address-input"
                    :class="errorClasses"
                    :placeholder="field.name"
                    :value="this.formatted"
                    ref="input"

                />
               <div :id="fieldName"  class="nova-maps-address-container" :class="{ hidden: !this.field.value }" ref="container"></div>

        </template>
    </panel-item>
</template>

<script>
import Maps from '../Maps'

export default {
    props: ['resource', 'resourceName', 'resourceId', 'field'],

     data() {
        return {
            fieldName: _.snakeCase(this.field.name),
        }
    },

    methods: {
        getValue() {

            if (this.field.value) {
                let value = `${this.field.value.latitude}, ${this.field.value.longitude}`
                
                //Display position name if exist
                if(this.field.value.formatted_address)
                    value += ` | ${this.field.value.formatted_address}`

                return value;
            }

            return '-'
        },

        setInitialValue() {
            const address = this.field.value
            this.formatted = address ? address.formatted_address : ''
            this.value = JSON.stringify(this.field.value) || ''
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
                allowMapClick: false,
                fieldName: this.fieldName,
                resourceName: this.resourceName,
            });
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
