package elastest.loganalyzer.es.client.rest;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import elastest.loganalyzer.es.client.model.Execution;
import elastest.loganalyzer.es.client.service.ExecutionService;
import elastest.loganalyzer.es.client.service.LogService;

@RestController
@RequestMapping("/api/executions")
public class ExecutionRest {

	@Autowired
	private ExecutionService executionService;
	@Autowired
	private LogService logService;

	@RequestMapping(value = "/{id}", method = RequestMethod.DELETE)
	public ResponseEntity<Execution> deleteById(@PathVariable int id) {
		Execution execution = executionService.findOne(id);
		if (execution != null) {
			logService.deleteIterable(logService.findByTestOrderByIdAsc(String.format("%02d", execution.getId())));
			executionService.delete(execution);
			return new ResponseEntity<>(execution, HttpStatus.OK);
		} else {
			return new ResponseEntity<>(HttpStatus.NOT_FOUND);
		}
	}

	@RequestMapping(value = "", method = RequestMethod.GET, params = "id")
	public ResponseEntity<Execution> getById(@RequestParam int id) {
		Execution execution = executionService.findOne(id);
		if (execution != null) {
			return new ResponseEntity<>(execution, HttpStatus.OK);
		} else {
			return new ResponseEntity<>(HttpStatus.NOT_FOUND);
		}
	}

	@RequestMapping(value = "", method = RequestMethod.GET, params = "project")
	public ResponseEntity<List<Execution>> getByProject(@RequestParam String project) {
		List<Execution> executions = executionService.findByProjectOrderByIdAsc(project);
		if (executions.size() > 0) {
			return new ResponseEntity<>(executions, HttpStatus.OK);
		} else {
			return new ResponseEntity<>(HttpStatus.NOT_FOUND);
		}
	}
}
