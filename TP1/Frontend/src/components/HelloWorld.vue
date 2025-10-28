<template>
  <div class="hello">
    <h1>Student Management System</h1>
    <p>
      Welcome to the student and department management application.
    </p>
    <div class="navigation">
      <router-link to="/departments">
        <a-button type="primary" size="large">View All Departments</a-button>
      </router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HelloWorld',
  props: {
    msg: String
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h1 {
  margin: 40px 0 20px;
  color: #2c3e50;
}
p {
  margin: 20px 0;
  color: #666;
}
.navigation {
  margin-top: 40px;
}
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
