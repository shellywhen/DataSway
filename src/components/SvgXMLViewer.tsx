import React, { useEffect, useState } from 'react';
import XMLViewer from 'react-xml-viewer';
import beautify from "xml-beautifier";
interface SvgXMLViewerProps {
  xml: string;
}

const SvgXMLViewer = ({ xml }: SvgXMLViewerProps ) => {
  const [hoveredElement, setHoveredElement] = useState<JSX.Element | null>(null);
  const [beatifiedXml, setBeautifyXml] = useState(beautify(xml));

  useEffect(() => {
    setBeautifyXml(beautify(xml));
  }, [xml]);



  const handleMouseEnter = (element: JSX.Element) => {
    setHoveredElement(element);
  };

  const handleMouseLeave = () => {
    setHoveredElement(null);
  };

  const customTheme = {
    attributeKeyColor: 'red',
    tagColor: 'blue',
    // Add more custom styles if needed
  };

  const renderElement = (element: JSX.Element) => {
    const isHovered = element === hoveredElement;
    const style = isHovered ? { backgroundColor: 'lightgray' } : {};

    return (
      <span
        style={style}
        onMouseEnter={() => handleMouseEnter(element)}
        onMouseLeave={ handleMouseLeave }
      >
        {element}
      </span>
    );
  };

  return (
    <XMLViewer
      xml={beatifiedXml}
      theme={customTheme}
      renderElement={renderElement}
      collapsible={true}
    />
  );
};

export default SvgXMLViewer;