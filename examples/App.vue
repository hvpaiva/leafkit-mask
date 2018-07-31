<template>
  <div>
    <h1>Leafkit Mask - Playground</h1>

    <div class="field">
      <label>Number <span>[ {{ mask.number }} ]</span></label>
      <input type="text" name="number" v-model="mask.number" v-mask-number>
    </div>

    <div class="field">
      <label>Number <span>[ {{ mask.number }} ]</span></label>
      <input type="text" name="number" v-model="mask.number" v-mask-number>
    </div>

  </div>
</template>

<script>
  export default {
    data () {
      return {
        mask: {
          generic: '',
          decimal: 0,
          number: 0
        }
      }
    },
    mounted () {
      this.defaultValues();
    },
    methods: {
      defaultValues () {
        this.mask = {
          generic: 'fbh3737h4hr377',
          decimal: 345738872,
          number: 2387832
        }
      }
    }
  }
</script>

<style>
  body, input {
    font-family: sans-serif;
  }
  .field {
    margin-bottom: 20px;
    color: #444;
  }
  .field label {
    display: inline-block;
    margin-bottom: 5px;
    font-size: 14px;
  }
  .field input {
    display: block;
    width: 300px;
    padding: 8px;
    font-size: 14px;
    border: 1px solid #ddd;
    border-radius: 3px;
  }
  .field span {
    margin-left: 10px;
    font-size: 13px;
    color: rgba(0, 0, 0, .7);
  }
</style>
