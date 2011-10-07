<div id="slider">
	<% control Panels %>
		<% if PanelLink %><% control PanelLink %><a href="$Link" title="$Title.XML"><% end_control %><% end_if %>
		<img src="$PanelImage.URL" alt="$PanelImage.Filename" <% if Title %>title="$Title"<% end_if %> />
		<% if PanelLink %></a><% end_if %>
	<% end_control %>
</div>