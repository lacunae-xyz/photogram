import React, { useState } from 'react';
import { parseName, parseData, parseImages } from './files';
import Empty from './Empty';
import Edls from './Edls';
import './index.css';

function Fixor(props) {
  const [edls, setEdls] = useState([]);

  function onFiles(files) {
    Promise.all([
      parseName(files, 'edl ' + (edls.length + 1)),
      parseData(files),
      parseImages(files),
    ])
      .then(results => {
        let [name, data, images] = results;

        data.forEach(d => {
          let imageResults = images.filter(i =>
            i.file.name.toLowerCase().includes(d.id.toLowerCase()),
          );
          if (imageResults.length === 1) {
            d.image = imageResults[0].result;
          } else {
            let imageResults2 = imageResults.filter(i =>
              i.file.name
                .toLowerCase()
                .includes(d.description.toLowerCase() + '.'),
            );
            if (imageResults2.length === 1) {
              d.image = imageResults2[0].result;
            }
          }
        });

        let edl = {
          name: name,
          data: data,
        };

        setEdls([...edls, edl]);
      })
      .catch(error => {
        console.warn(error);
      });
  }

  if (edls.length === 0) {
    return (
      <div className="fixor-container">
        <Empty onFiles={onFiles} />
      </div>
    );
  } else {
    return <Edls onFiles={onFiles} edls={edls} />;
  }
}

export default Fixor;
