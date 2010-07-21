<?php 
class NivoSliderPanel extends DataObject {
	static $db = array (
		'Name' => 'Text'
	);

	static $has_one = array(
		'NivoSliderPage' => 'NivoSliderPage',
		'PanelImage' => 'File',
    	'PanelLink' => 'SiteTree'
	);
	
	static $api_access = true;
	
	public function getCMSFields_forPopup(){
	    if (class_exists('SimpleTreeDropdownField'))$a='SimpleTreeDropdownField'; else $a='HTMLDropdownField';
	    
		return new FieldSet(
			new TextField('Name'),
			new FileIFrameField('PanelImage','Slide Image. Note: for optimal results, match image dimensions with panel dimensions.'),
			new $a("PanelLinkID",_t('RedirectorPage.YOURPAGEJS', "Link Target"),"SiteTree")
		);
	}
	
	
	function Thumbnail() {
        if ($Image = $this->PanelImage()) {
	        return $Image->CMSThumbnail();
        } else {
	        return null;
        }
    }
    public function canCreate() {       
        $member = Member::currentUser();
        if($member->inGroup(1)) return true;
        else return false;
	} 
    
    public function canEdit() {       
        $member = Member::currentUser();
        if($member->inGroup(1) || $member->inGroup(2)) return true;
        else return false;
	} 
    public function canDelete() {       
        $member = Member::currentUser();
        if($member->inGroup(1)) return true;
        else return false;
	}
}