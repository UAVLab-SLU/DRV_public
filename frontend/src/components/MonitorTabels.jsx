import React from 'react';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import AddIcon from '@mui/icons-material/Add';
import InfoIcon from '@mui/icons-material/Info';
import Grid from '@mui/material/Grid';

export default function MonitorTabels(colData) {
  const columns = [
    { id: 1, label: 'Latitude', minWidth: 100 },
    { id: 2, label: 'Longitude', minWidth: 100 },
    { id: 3, label: 'Altitude', minWidth: 100 },
    { id: 4, label: 'Action', minWidth: 100 },
  ];
  const columnsWithoutAltitude = [
    { id: 1, label: 'Latitude', minWidth: 100 },
    { id: 2, label: 'Longitude', minWidth: 100 },
    { id: 4, label: 'Action', minWidth: 100 },
  ];

  const [rows, setRows] = React.useState([[0, 0, 0]]);
  const [style, setStyle] = React.useState({
    display: 'block',
    background: 'rgb(224 224 224)',
    width: '100%',
  });

  const addNewRow = () => setRows((prev) => [...prev, [0, 0, 0]]);
  const removeRow = (index) => setRows((prev) => prev.filter((_, i) => i !== index));
  const handleChange = (event, index, innerIdx) => {
    setRows((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const next = [...row];
        next[innerIdx] = parseFloat(event.target.value);
        return next;
      }),
    );
  };

  React.useEffect(() => {
    colData.jsonVal(rows);
  }, [rows]);

  const maxHeight = colData.windowHeight ? colData.windowHeight - 200 : 400;

  return (
    <Paper sx={{ width: '100%' }}>
      {colData.errorMessage === 'true' && rows.length < 4 && (
        <div style={{ padding: '5px', color: 'blue' }}>
          <Grid container direction="row">
            <InfoIcon />
            &nbsp;Minimum 4 rows required
          </Grid>
        </div>
      )}
      <TableContainer sx={{ maxHeight }}>
        <Table stickyHeader aria-label="waypoints table">
          <TableHead>
            <TableRow>
              {(colData.hideAltitude === 'true' ? columnsWithoutAltitude : columns).map((col) => (
                <TableCell key={col.id} style={{ minWidth: col.minWidth }}>
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={index}>
                <TableCell>
                  <TextField variant="standard" type="number" inputProps={{ step: '.0001' }} value={row[0]} onChange={(e) => handleChange(e, index, 0)} />
                </TableCell>
                <TableCell>
                  <TextField variant="standard" type="number" inputProps={{ step: '.0001' }} value={row[1]} onChange={(e) => handleChange(e, index, 1)} />
                </TableCell>
                {colData.hideAltitude !== 'true' && (
                  <TableCell>
                    <TextField variant="standard" type="number" inputProps={{ step: '1' }} value={row[2]} onChange={(e) => handleChange(e, index, 2)} />
                  </TableCell>
                )}
                <TableCell onClick={() => removeRow(index)}>
                  <DeleteForeverIcon />
                </TableCell>
              </TableRow>
            ))}
            <TableRow
              onMouseEnter={() => setStyle({ display: 'block', background: 'rgb(224 224 224)', width: '100%' })}
              onMouseLeave={() => setStyle({ display: 'block', background: 'rgb(224 224 224)', width: '100%' })}
            >
              <TableCell component="th" scope="row" colSpan={4} onClick={addNewRow}>
                <AddIcon style={style} />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
