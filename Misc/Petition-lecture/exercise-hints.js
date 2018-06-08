// create public directory with js file and css but no html.
// you do not use res.send but only res.render bc it is not a static site
// before form is submitted the input of canvas has to be stored. either on mouseup or on submit...
// create a database for this project called petition
// need 2 routes app.post and app.get petition ==> if worked redirect to thank you page,
// if not render to same template but with error message. the thank you page needs to be an actual url
// within app.get that you can redirect to. before redirecting set a cookie. meaning if petition is already
// signed redirect them directly to thank you sign. for thank you page we need handlebars bc it's gonna be dynamic
// for the signers page make a db query to find out how many signers there are. pass result from db to template.
// get for thank you and get for signers

// in all routes cookie checks for petition.
// 3 templates. for get and post app for petition. template for signers and thank you
// js file needs to do dom events handling for canvas and putting in hidden input filed the signatures
// script file only on petition page

//For Canvas

{{#error}}
<div class="error">Oops, you messed that up</div>
{{/error}}
<form method="POST">
<input name="first">
<input name="sig"  type="hidden">

// db table
Create Table signatures (
id serial primary key,
first varchar(300) not null,
last varchar(300) not null,
signature text not null
)
